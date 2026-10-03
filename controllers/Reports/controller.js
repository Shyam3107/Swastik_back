import momentTimezone from "moment-timezone";

import OfficeExpense from "../../models/OfficeExpense.js";
import Receipt from "../../models/Receipt.js";
import Trip from "../../models/Trip.js";
import VehiclesExpense from "../../models/VehiclesExpense.js";
import Diesel from "../../models/Diesel.js";
import Fleets from "../../models/Fleet.js";
import {
  handleError,
  parseResponse,
  dateToString,
  columnHeaders,
  userRankQuery,
  formatDateInDDMMYYY,
  sortViaDate,
} from "../../utils/utils.js";
import { sendExcelFile } from "../../utils/sendFile.js";
import { INDIA_TZ } from "../../config/constants.js";
import mongoose from "mongoose";
import HardwareShopBill from "../../models/HardwareShopBill.js";
import { createZipFile } from "../../utils/zip.js";
import { createExcelFile } from "../../utils/sendFile.js";

momentTimezone.tz.setDefault(INDIA_TZ);

// Get Excel File Trips + Office Exp + Vehicle Exp + Receipts
export const getVehiclesReport = async (req, res) => {
  try {
    const user = req.user;
    let { from, to } = req.query;

    let select = {
      _id: 0,
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      companyAdminId: 0,
    };

    let populate = { path: "addedBy", select: "location" };

    let query = {
      companyAdminId: user.companyAdminId,
      date: { $gte: from, $lte: to },
    };

    let trips = Trip.find(query)
      .select({
        _id: 0,
        date: 1,
        location: 1,
        vehicleNo: 1,
        quantity: 1,
        driverName: 1,
        pumpName: 1,
        diesel: 1,
        dieselIn: 1,
        shortage: 1,
        shortageAmount: 1,
        cash: 1,
        remarks: 1,
        billingRate: 1,
        rate: 1,
        addedBy: 1,
      })
      .populate(populate)
      .sort({ date: 1 });

    let vehicleExpenses = VehiclesExpense.find(query)
      .select(select)
      .populate(populate);

    let officeExpenses = OfficeExpense.find(query)
      .select(select)
      .populate(populate);

    let receipts = Receipt.find(query).select(select).populate(populate);

    const data = await Promise.all([
      trips,
      vehicleExpenses,
      officeExpenses,
      receipts,
    ]);

    trips = data[0].map((val) => {
      val = val._doc;
      val = {
        ...val,
        diesel: val.dieselIn === "Litre" ? val.diesel : "",
        amount: val.dieselIn === "Amount" ? val.diesel : "",
        addedBy: val?.addedBy?.location ?? "",
        debit: val.cash,
        date: dateToString(val.date),
      };
      delete val.cash;
      return val;
    });

    vehicleExpenses = data[1].map((val) => {
      val = val._doc;
      val = {
        ...val,
        debit: val.amount,
        diesel: val.dieselIn === "Litre" ? val.diesel : "",
        amount: val.dieselIn === "Amount" ? val.diesel : "",
        addedBy: val?.addedBy?.location ?? "",
        date: dateToString(val.date),
      };
      return val;
    });

    officeExpenses = data[2].map((val) => {
      val = val._doc;
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        debit: val.amount,
        date: dateToString(val.date),
      };
      delete val.amount;
      return val;
    });

    receipts = data[3].map((val) => {
      val = val._doc;
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        credit: val.amount,
        date: dateToString(val.date),
      };
      delete val.amount;
      return val;
    });

    const columns = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Location", "location"),
      columnHeaders("Qty", "quantity"),
      columnHeaders("Driver", "driverName"),
      columnHeaders("Diesel(ltr)", "diesel"),
      columnHeaders("Diesel(Amt)", "amount"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Shortage", "shortage"),
      columnHeaders("Shortage Amount", "shortageAmount"),
      columnHeaders("Credit", "credit"),
      columnHeaders("Debit", "debit"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Billing Rate", "billingRate"),
      columnHeaders("Rate", "rate"),
      columnHeaders("Added By", "addedBy"),
    ];

    return sendExcelFile(
      res,
      [columns],
      [
        [...trips, ...vehicleExpenses, ...officeExpenses, ...receipts].sort(
          (a, b) => (a.date > b.date ? 1 : -1)
        ),
      ],
      ["Reports"]
    );
  } catch (error) {
    return handleError(res, error);
  }
};

// Get Whicle vehicle take how much diesel
// and How much diesel from which pump
export const getDieselsReport = async (req, res) => {
  try {
    const user = req.user;
    let { from, to } = req.query;

    let match = {
      companyAdminId: mongoose.Types.ObjectId(user?.companyAdminId?._id),
      date: { $gte: new Date(from), $lte: new Date(to) },
    };

    let vehicleWise = await Diesel.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: "vehicleowners",
          localField: "vehicleNo",
          foreignField: "vehicleNo",
          as: "owner",
        },
      },
      {
        $unwind: {
          path: "$owner",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            vehicleNo: "$vehicleNo",
            owner: "$owner",
          },
          quantity: { $sum: "$quantity" },
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          vehicleNo: "$_id.vehicleNo",
          owner: {
            // This check is to make sure it is fetching from Our Company only
            $cond: [
              {
                $eq: [
                  "$_id.owner.companyAdminId",
                  mongoose.Types.ObjectId(user?.companyAdminId?._id),
                ],
              },
              "$_id.owner.owner",
              "",
            ],
          },
          quantity: 1,
          amount: 1,
        },
      },
      {
        $sort: {
          vehicleNo: 1,
        },
      },
    ]);

    let pumpWise = await Diesel.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: {
            pumpName: "$pumpName",
          },
          quantity: { $sum: "$quantity" },
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          pumpName: "$_id.pumpName",
          quantity: 1,
          amount: 1,
        },
      },
      {
        $sort: {
          pumpName: 1,
        },
      },
    ]);

    const column1 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Owner", "owner"),
    ];

    const column2 = [
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Amount", "amount"),
    ];

    return sendExcelFile(
      res,
      [column1, column2],
      [vehicleWise, pumpWise],
      ["Vehicle Wise Report", "Pump Wise Report"]
    );
  } catch (error) {
    return handleError(res, error);
  }
};

export const getHardwareShopReport = async (req, res) => {
  try {
    const user = req.user;
    let { from, to } = req.query;

    let match = {
      $match: {
        companyAdminId: mongoose.Types.ObjectId(user?.companyAdminId?._id),
        date: { $gte: new Date(from), $lte: new Date(to) },
      },
    };

    let shopWise = await HardwareShopBill.aggregate([
      match,
      {
        $group: {
          _id: {
            shopName: "$shopName",
          },
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          shopName: "$_id.shopName",
          amount: 1,
        },
      },
      {
        $sort: {
          shopName: 1,
        },
      },
    ]);

    let vehicleWise = await HardwareShopBill.aggregate([
      match,
      {
        $group: {
          _id: {
            vehicleNo: "$vehicleNo",
          },
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          vehicleNo: "$_id.vehicleNo",
          amount: 1,
        },
      },
      {
        $sort: {
          vehicleNo: 1,
        },
      },
    ]);

    const column1 = [
      columnHeaders("Shop Name", "shopName"),
      columnHeaders("Amount", "amount"),
    ];

    const column2 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Amount", "amount"),
    ];

    return sendExcelFile(
      res,
      [column1, column2],
      [shopWise, vehicleWise],
      ["Shop Report", "Vehicle Report"]
    );
  } catch (error) {
    return handleError(res, error);
  }
};

// Get Trips + Diesel + Vehicle Expense
export const getVehicleDieselReport = async (req, res) => {
  try {
    const user = req.user;
    let { from, to } = req.query;

    let populate = { path: "addedBy", select: "location" };

    let query = {
      companyAdminId: user.companyAdminId,
      date: { $gte: from, $lte: to },
    };

    //{$and:[{diesel:{$ne:0}},{diesel:{$ne:null}}]}

    let trips = await Trip.find({
      ...query,
      $and: [{ diesel: { $ne: 0 } }, { diesel: { $ne: null } }],
    })
      .select({
        _id: 0,
        date: 1,
        vehicleNo: 1,
        pumpName: 1,
        diesel: 1,
        dieselIn: 1,
        addedBy: 1,
      })
      .populate(populate)
      .sort({ date: 1 });

    trips = parseResponse(trips);

    trips = trips.map((val) => {
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        date: dateToString(val.date),
      };
      return val;
    });

    let diesel = await Diesel.find(query)
      .select({
        _id: 0,
        date: 1,
        vehicleNo: 1,
        pumpName: 1,
        quantity: 1,
        amount: 1,
        addedBy: 1,
      })
      .populate(populate)
      .sort({ date: 1 });

    diesel = parseResponse(diesel);
    diesel = diesel.map((val) => {
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        date: dateToString(val.date),
      };
      return val;
    });

    let vehicleExpenses = await VehiclesExpense.find({
      ...query,
      $and: [{ diesel: { $ne: 0 } }, { diesel: { $ne: null } }],
    })
      .select({
        _id: 0,
        date: 1,
        vehicleNo: 1,
        pumpName: 1,
        diesel: 1,
        dieselIn: 1,
        addedBy: 1,
      })
      .populate(populate)
      .sort({ date: 1 });

    vehicleExpenses = parseResponse(vehicleExpenses);

    vehicleExpenses = vehicleExpenses.map((val) => {
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        date: dateToString(val.date),
      };
      return val;
    });

    const columns = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Diesel", "diesel"),
      columnHeaders("Diesel In", "dieselIn"),
      columnHeaders("Quantity (Pump)", "quantity"),
      columnHeaders("Amount (Pump)", "amount"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Added By", "addedBy"),
    ];

    return sendExcelFile(
      res,
      [columns],
      [[...trips, ...diesel, ...vehicleExpenses]],
      ["Reports"]
    );
  } catch (error) {
    return handleError(res, error);
  }
};

// Get Zip File Containing Excel files as per Vehicle No.
// Excel File contains all Expense on Vehicle including Diesel
// Trips + Diesel + Vehicle Exp
export const downloadAllVehicleWiseReport = async (req, res) => {
  try {
    const user = req.user;
    let { from, to } = req.query;

    let query = {
      companyAdminId: user.companyAdminId,
      date: { $gte: from, $lte: to },
    };

    let select = {
      _id: 0,
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      companyAdminId: 0,
      addedBy: 0,
    };

    // Get Fleet List
    let fleets = await Fleets.find({ companyAdminId: user.companyAdminId });
    fleets = parseResponse(fleets);
    let tempFleet = {};
    fleets = fleets.forEach((val) => {
      tempFleet[val.vehicleNo?.substr(-4)] = val.owner;
    });

    // Get All Data from Trips, Diesel and Vehicle Expense
    let tripsData = Trip.find(query)
      .select({
        ...select,
        pumpName: 0,
        diNo: 0,
        lrNo: 0,
        partyName: 0,
        bags: 0,
        driverPhone: 0,
        partyName2: 0,
        material: 0,
        driverName: 0,
      })
      .sort({ date: 1 });

    let expenseData = VehiclesExpense.find(query)
      .select({ ...select })
      .sort({ date: 1 });

    let dieselData = Diesel.find(query)
      .select({ ...select, fuel: 0 })
      .sort({ date: 1 });

    let data = await Promise.all([tripsData, expenseData, dieselData]);
    tripsData = parseResponse(data[0]);
    expenseData = parseResponse(data[1]);
    dieselData = parseResponse(data[2]);

    // Will be used to map the vehicle number
    data = {};

    // Here we are merging Trips Diesel and Pump Diesel
    // First Store the Both Data in Temp Object vehicle Wise
    let tempTripVehicle = {};
    let tempDieselVehicle = {}; // All Diesel Data will be stored here vehicle wise
    tripsData.forEach((val) => {
      const vehicleNo = val.vehicleNo.substr(-4);

      // If new Vehicle No.
      if (!tempTripVehicle[vehicleNo]) tempTripVehicle[vehicleNo] = [];

      if (!val.cash) val.cash = 0;

      // In case of Market Vehicle we are reducing the rate by 50 or 30 as per the billing rate
      if (tempFleet[vehicleNo] !== "SELF") {
        val.rate = val.billingRate > 1000 ? val.billingRate - 50 : val.billingRate - 30;
      }

      tempTripVehicle[vehicleNo].push({
        ...val,
        date: formatDateInDDMMYYY(val.date),
        driverCash: val.cash,
      });
    });

    tripsData = Object.keys(tempTripVehicle).sort();

    // Then Diesel
    dieselData.forEach((val) => {
      const vehicleNo = val.vehicleNo.substr(-4);

      // If new Vehicle No.
      if (!tempDieselVehicle[vehicleNo]) tempDieselVehicle[vehicleNo] = [];

      let tempVal = {
        ...val,
        pumpDate: formatDateInDDMMYYY(val.date),
        pumpDiesel: val.quantity,
      }

      delete tempVal.quantity; // as it will be used in Trips
      delete tempVal.date; // as it will be used in Trips

      tempDieselVehicle[vehicleNo].push(tempVal);
    });

    dieselData = Object.keys(tempDieselVehicle).sort();

    const tripLength = tripsData.length;

    const dieselLength = dieselData.length;

    let a = 0; // index for Trip length
    let b = 0; // index for Diesel Length
    for (; a < tripLength && b < dieselLength;) {

      if (tripsData[a] > dieselData[b]) { // Compare the Vehicle No. and then merge the data
        // If Diesel Vehicle No. is less than Trip Vehicle No. then add the Diesel Data to the final data
        const veh = dieselData[b];
        if (!data[veh]) data[veh] = [];
        data[veh] = tempDieselVehicle[veh];
        b++;
      } else if (tripsData[a] < dieselData[b]) {
        const veh = tripsData[a];
        if (!data[veh]) data[veh] = [];
        data[veh] = tempTripVehicle[veh];
        a++;
      } else {
        const veh = tripsData[a];
        if (!data[veh]) data[veh] = [];
        const tl = tempTripVehicle[veh].length; // Number of Trips for the Vehicle
        const dl = tempDieselVehicle[veh].length; // Number of Diesel for the Vehicle

        let j = 0;
        for (; j < Math.min(tl, dl); j++) {
          data[veh].push({
            ...tempTripVehicle[veh][j],
            pumpDate: tempDieselVehicle[veh][j].pumpDate,
            pumpDiesel: tempDieselVehicle[veh][j].pumpDiesel,
            pumpName: tempDieselVehicle[veh][j].pumpName,
            pumpAmount: tempDieselVehicle[veh][j].amount,
          });
        }
        for (let k = j; k < tl; k++) {
          data[veh].push(tempTripVehicle[veh][k]);
        }
        for (let k = j; k < dl; k++) {
          data[veh].push({ ...tempDieselVehicle[veh][k], 
            date: tempDieselVehicle[veh][k].pumpDate, 
            pumpAmount: tempDieselVehicle[veh][j].amount, });
        }
        a++;
        b++;
      }
    }

    //For Remaining Data
    // Trips First
    for (; a < tripLength; a++) {
      const veh = tripsData[a];
      if (!data[veh]) data[veh] = [];
      data[veh] = tempTripVehicle[veh];
    }

    // Diesel second
    for (; b < dieselLength; b++) {
      const veh = dieselData[b];
      if (!data[veh]) data[veh] = [];
      data[veh] = tempDieselVehicle[veh];
    }

    tripsData = null;
    tempDieselVehicle = null;
    dieselData = null;
    tempTripVehicle = null;

    // Then Expense
    expenseData.forEach((val) => {
      const vehicleNo = val.vehicleNo.substr(-4);

      // If new Vehicle No.
      if (!data[vehicleNo]) data[vehicleNo] = [];

      if (!val.amount) val.amount = 0;

      data[vehicleNo].push({
        ...val,
        date: formatDateInDDMMYYY(val.date),
        driverCash: val.expenseFor !== "Vehicle" ? val.amount : 0,
        vehicleCash: val.expenseFor === "Vehicle" ? val.amount : 0,
      });
    });

    console.log("Preparing the Excel WorkBook for vehicles");
    const column1 = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Loading Point", "loadingPoint"),
      columnHeaders("Location", "location"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Billing Rate", "billingRate"),
      columnHeaders("Rate", "rate"),
      columnHeaders("Total", "total"),
      columnHeaders("Diesel", "diesel"),
      //columnHeaders("Pump Date", "pumpDate"),
      //columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Pump Diesel", "pumpDiesel"),
      columnHeaders("Pump Amount", "pumpAmount"),
      columnHeaders("Shortage", "shortage"),
      columnHeaders("Shortage Amount", "shortageAmount"),
      columnHeaders("Driver cash", "driverCash"),
      columnHeaders("Vehicle Cash", "vehicleCash"),
      columnHeaders("Remarks", "remarks"),
    ];

    let excelFilesSelf = [];
    let excelFilesMarket = [];
    let vehicleNoSelf = [];
    let vehicleNoMarket = [];

    const vehicleNoList = Object.keys(data);

    vehicleNoList.forEach((vehicleNo) => {
      data[vehicleNo] = sortViaDate(data[vehicleNo]);

      // We have to calulate Total Amount ie Rate and Quantity 
      // As Rows number is change after merging the data of Trips, Diesel and Vehicle Expense
      data[vehicleNo] = data[vehicleNo].map((val, index) => {
        return {
          ...val,
          total: { formula: `E${index + 2}*G${index + 2}` },
        };
      });

      // Adding Formula for Total in Excel File in last Row of the Vehicle No. Data
      data[vehicleNo].push({
        location: "Total",
        quantity: { formula: `SUM(E2:E${data[vehicleNo].length + 1})` },
        total: { formula: `SUM(H2:H${data[vehicleNo].length + 1})` },
        diesel: { formula: `SUM(I2:I${data[vehicleNo].length + 1})` },
        pumpDiesel: { formula: `SUM(L2:L${data[vehicleNo].length + 1})` },
        pumpAmount: { formula: `SUM(M2:M${data[vehicleNo].length + 1})` },
        shortae: { formula: `SUM(N2:N${data[vehicleNo].length + 1})` },
        shortageAmount: { formula: `SUM(O2:O${data[vehicleNo].length + 1})` },
        driverCash: { formula: `SUM(P2:P${data[vehicleNo].length + 1})` },
        vehicleCash: { formula: `SUM(Q2:Q${data[vehicleNo].length + 1})` },
      });

      // if Vehicle No. is in Fleet then it is self vehicle else Market vehicle
      if (tempFleet[vehicleNo]) {
        vehicleNoSelf.push(vehicleNo);
        excelFilesSelf.push(
          createExcelFile(
            [column1],
            [data[vehicleNo]],
            [vehicleNo]
          ).xlsx.writeBuffer()
        );
      } else {
        vehicleNoMarket.push(vehicleNo);
        excelFilesMarket.push(
          createExcelFile(
            [column1],
            [data[vehicleNo]],
            [vehicleNo]
          ).xlsx.writeBuffer()
        );
      }
    });

    excelFilesSelf = await Promise.all(excelFilesSelf);
    excelFilesMarket = await Promise.all(excelFilesMarket);
    console.log("Excel Files had been created");
    excelFilesSelf = excelFilesSelf.map((file, index) => {
      return {
        file,
        fileName: "Self/" + vehicleNoSelf[index] + ".xlsx",
      };
    });
    excelFilesMarket = excelFilesMarket.map((file, index) => {
      return {
        file,
        fileName: "Market/" + vehicleNoMarket[index] + ".xlsx",
      };
    });

    vehicleNoSelf = null;
    vehicleNoMarket = null;

    const files = await createZipFile([...excelFilesMarket, ...excelFilesSelf]);
    console.log("Zip File had been created");
    const fileName = "reports.zip";
    const fileType = "application/zip";

    res.writeHead(200, {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": fileType,
    });

    return res.end(files);

    //return res.status(200).json({ data })
  } catch (error) {
    return handleError(res, error);
  }
};

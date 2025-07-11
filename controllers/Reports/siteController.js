import momentTimezone from "moment-timezone";

import OfficeExpense from "../../models/OfficeExpense.js";
import Receipt from "../../models/Receipt.js";
import Trip from "../../models/Trip.js";
import VehiclesExpense from "../../models/VehiclesExpense.js";
import Account from "../../models/Account.js";
import {
  handleError,
  parseResponse,
  dateToString,
  columnHeaders,
} from "../../utils/utils.js";
import { sendExcelFile } from "../../utils/sendFile.js";
import { INDIA_TZ } from "../../config/constants.js";
import mongoose from "mongoose";

momentTimezone.tz.setDefault(INDIA_TZ);

// Get All details of site by siteId
const getSiteReportBySiteId = async (siteId, from, to, companyAdminId) => {
  try {
    // Opening Balance
    // Closing Balance
    // Total amount Credited during Period
    // Total Debited During Period

    // All Entry During That Period, Trips + Receipts + Office Expense + Vehcile Expense
    const query = {
      companyAdminId,
      date: { $gte: from, $lte: to },
      addedBy: siteId,
    };

    const select = {
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      companyAdminId: 0,
      addedBy: 0,
    };

    let duringAllCred = Receipt.find(query).select(select).sort({ date: 1 });

    let duringAllTrips = Trip.find(query).select(select).sort({ date: 1 });

    let duringAllOE = OfficeExpense.find(query)
      .select(select)
      .sort({ date: 1 });

    let duringAllVE = VehiclesExpense.find(query)
      .select(select)
      .sort({ date: 1 });

    // Opening Balance
    // Total amount Credited - debited , date < from

    const openingMatch = {
      $match: {
        date: { $lt: new Date(from) },
        addedBy: mongoose.Types.ObjectId(siteId),
        companyAdminId: mongoose.Types.ObjectId(companyAdminId?._id),
      },
    };

    const roundOff = {
      $project: {
        total: { $round: ["$total", 2] },
      },
    };

    let openingCred = Receipt.aggregate([
      openingMatch,
      {
        $group: {
          _id: {},
          total: { $sum: "$amount" },
        },
      },
      roundOff,
    ]);

    // Total amount Debited = Trips + Vehicle Expenses + Office Expenses
    let openingTrip = Trip.aggregate([
      openingMatch,
      {
        $group: {
          _id: {},
          total: { $sum: "$cash" },
        },
      },
      roundOff,
    ]);

    let openingVE = VehiclesExpense.aggregate([
      openingMatch,
      {
        $group: {
          _id: {},
          total: { $sum: "$amount" },
        },
      },
      roundOff,
    ]);

    let openingOE = OfficeExpense.aggregate([
      openingMatch,
      {
        $group: {
          _id: {},
          total: { $sum: "$amount" },
        },
      },
      roundOff,
    ]);

    // Total Amount Credited and Debited During Period

    // Condition for Aggregate Query
    const duringMatch = {
      $match: {
        date: { $gte: new Date(from), $lte: new Date(to) },
        addedBy: mongoose.Types.ObjectId(siteId),
        companyAdminId: mongoose.Types.ObjectId(companyAdminId?._id),
      },
    };

    // Total Received
    let duringCred = Receipt.aggregate([
      duringMatch,
      {
        $group: {
          _id: {},
          total: { $sum: "$amount" },
        },
      },
      roundOff,
    ]);

    // Debited During Peiord = Trips + Vehicle Expense + Office Expense
    let duringTrip = Trip.aggregate([
      duringMatch,
      {
        $group: {
          _id: {},
          total: { $sum: "$cash" },
        },
      },
      roundOff,
    ]);

    let duringVE = VehiclesExpense.aggregate([
      duringMatch,
      {
        $group: {
          _id: {},
          total: { $sum: "$amount" },
        },
      },
      roundOff,
    ]);

    let duringOE = OfficeExpense.aggregate([
      duringMatch,
      {
        $group: {
          _id: {},
          total: { $sum: "$amount" },
        },
      },
      roundOff,
    ]);

    let siteName = Account.findById({ _id: siteId }).select("location");

    // This is used to reduce Time, all query are independent
    let data = await Promise.all([
      openingCred,
      openingTrip,
      openingVE,
      openingOE,
      duringCred,
      duringTrip,
      duringVE,
      duringOE,
      duringAllCred,
      duringAllTrips,
      duringAllOE,
      duringAllVE,
      siteName,
    ]);

    siteName = data[12]?.location ?? "SITE";

    // Credited - Trips - Vehicle Expense - Office Expense
    openingCred = data[0]?.shift()?.total ?? 0;
    openingTrip = data[1]?.shift()?.total ?? 0;
    openingVE = data[2]?.shift()?.total ?? 0;
    openingOE = data[3]?.shift()?.total ?? 0;
    const openingBal = openingCred - openingTrip - openingVE - openingOE;

    const periodCred = data[4]?.shift()?.total ?? 0;

    const tripExpense = data[5]?.shift()?.total ?? 0;
    const vehicleExpense = data[6]?.shift()?.total ?? 0;
    const officeExpense = data[7]?.shift()?.total ?? 0;
    const periodDeb = tripExpense + vehicleExpense + officeExpense;

    const closingBal = openingBal + periodCred - periodDeb;

    // Formatting the Entries/values in specific Period
    duringAllCred = data[8].map((val) => {
      return {
        date: val.date,
        remarks: val.remarks,
        credit: val.amount,
      };
    });

    duringAllTrips = data[9].map((val) => {
      return {
        date: val.date,
        remarks: val.remarks,
        debit: val.cash ?? 0,
        location: val.location,
        vehicleNo: val.vehicleNo,
      };
    });

    duringAllOE = data[10].map((val) => {
      return {
        date: val.date,
        remarks: val.remarks,
        debit: val.amount,
      };
    });

    duringAllVE = data[11].map((val) => {
      return {
        date: val.date,
        vehicleNo: val.vehicleNo,
        remarks: val.remarks,
        debit: val.amount,
      };
    });

    // Accumulate all data and sort as per date
    const records = [
      ...duringAllOE,
      ...duringAllCred,
      ...duringAllVE,
      ...duringAllTrips,
    ]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .map((val) => {
        return {
          ...val,
          date: dateToString(val.date),
        };
      });

    return {
      siteName,
      openingBal: openingBal,
      periodCred: periodCred,
      periodDeb: periodDeb,
      closingBal: closingBal,
      tripExpense: tripExpense,
      officeExpense: officeExpense,
      vehicleExpense: vehicleExpense,
      noOfTrips: duringAllTrips.length,
      records,
    };
  } catch (error) {
    return handleError(res, error);
  }
};

// Get Specifc site report includes, their opening balance. closing balance and all entry by them
export const getSiteReport = async (req, res) => {
  try {
    const user = req.user;
    const companyAdminId = user.companyAdminId;
    let { from, to, siteId } = req.query;

    let siteDetail = await Account.findById({ _id: siteId });

    // If Site Deleted
    if (!siteDetail) throw "Record Not found";

    const data = await getSiteReportBySiteId(siteId, from, to, companyAdminId);

    if (!data) throw "Record Not Found";

    return res.status(200).json({ data });
  } catch (error) {
    return handleError(res, error);
  }
};

// Download Specifc site report includes, their opening balance. closing balance and all entry by them
export const downloadSiteReport = async (req, res) => {
  try {
    const user = req.user;
    const companyAdminId = user.companyAdminId;
    let { from, to, siteId } = req.query;

    let siteDetail = await Account.findById({ _id: siteId }).select("location");

    // If Site Deleted
    if (!siteDetail) throw "Record Not found";

    const data = await getSiteReportBySiteId(siteId, from, to, companyAdminId);

    data.site = siteDetail.location;

    if (!data) throw "Record Not Found";

    const column1 = [
      columnHeaders("Site", "site"),
      columnHeaders("Opening Balance", "openingBal"),
      columnHeaders("Total Credit", "periodCred"),
      columnHeaders("Total Debit", "periodDeb"),
      columnHeaders("Closing Balance", "closingBal"),
      columnHeaders("Trip Expense", "tripExpense"),
      columnHeaders("Office Expense", "officeExpense"),
      columnHeaders("No. Of Trips", "noOfTrips"),
    ];

    const column2 = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Location", "location"),
      columnHeaders("Credit", "credit"),
      columnHeaders("Debit", "debit"),
      columnHeaders("Remarks", "remarks"),
    ];

    return sendExcelFile(
      res,
      [column1, column2],
      [[data], data.records],
      ["Info", "Reports"]
    );
  } catch (error) {
    return handleError(res, error);
  }
};

// Get all Site Report, includes name, their trips and opening balance, current balance for that period
export const getAllSiteReport = async (req, res) => {
  try {
    const user = req.user;
    const companyAdminId = user.companyAdminId;
    let { from, to } = req.query;

    // Number of Trips
    // Opening Balance
    // Closing Balance
    // Total amount Credited during Period
    // Total Debited During Period

    // Opening Balance
    // Total amount Credited - debited , date < from

    const openingMatch = {
      $match: {
        date: { $lt: new Date(from) },
        companyAdminId: mongoose.Types.ObjectId(companyAdminId?._id),
      },
    };

    const openingGroup = {
      _id: {
        id: "$addedBy",
      },
    };

    const project = {
      $project: {
        id: "$_id.id",
        total: "$total",
        _id: 0,
      },
    };

    let openingCred = Receipt.aggregate([
      openingMatch,
      {
        $group: {
          ...openingGroup,
          total: { $sum: "$amount" },
        },
      },
      project,
    ]);

    // Total amount Debited = Trips + Vehicle Expenses + Office Expenses
    let openingTrip = Trip.aggregate([
      openingMatch,
      {
        $group: {
          ...openingGroup,
          total: { $sum: "$cash" },
        },
      },
      project,
    ]);

    let openingVE = VehiclesExpense.aggregate([
      openingMatch,
      {
        $group: {
          ...openingGroup,
          total: { $sum: "$amount" },
        },
      },
      project,
    ]);

    let openingOE = OfficeExpense.aggregate([
      openingMatch,
      {
        $group: {
          ...openingGroup,
          total: { $sum: "$amount" },
        },
      },
      project,
    ]);

    // Total Amount Credited and Debited During Period
    const duringMatch = {
      $match: {
        date: { $gte: new Date(from), $lte: new Date(to) },
        companyAdminId: mongoose.Types.ObjectId(companyAdminId?._id),
      },
    };

    // Total Received
    let duringCred = Receipt.aggregate([
      duringMatch,
      {
        $group: {
          ...openingGroup,
          total: { $sum: "$amount" },
        },
      },
      project,
    ]);

    // Debited During Peiord = Trips + Vehicle Expense + Office Expense
    let duringTrip = Trip.aggregate([
      duringMatch,
      {
        $group: {
          ...openingGroup,
          total: { $sum: "$cash" },
        },
      },
      project,
    ]);

    let duringVE = VehiclesExpense.aggregate([
      duringMatch,
      {
        $group: {
          ...openingGroup,
          total: { $sum: "$amount" },
        },
      },
      project,
    ]);

    let duringOE = OfficeExpense.aggregate([
      duringMatch,
      {
        $group: {
          ...openingGroup,
          total: { $sum: "$amount" },
        },
      },
      project,
    ]);

    // Number of Trips from all site
    let duringAllTrips = Trip.aggregate([
      duringMatch,
      {
        $group: {
          ...openingGroup,
          total: { $sum: 1 },
        },
      },
      project,
    ]);

    let allSites = Account.find({ companyAdminId })
      .select("location")
      .sort({ location: 1 });

    let data = await Promise.all([
      openingCred,
      openingTrip,
      openingVE,
      openingOE,
      duringCred,
      duringTrip,
      duringVE,
      duringOE,
      duringAllTrips,
      allSites,
    ]);

    //data.map(val => parseResponse(val?._doc))

    let [
      openingCredT,
      openingTripT,
      openingVET,
      openingOET,
      duringCredT,
      duringTripT,
      duringVET,
      duringOET,
      duringAllTripsT,
      allSitesT,
    ] = data;

    data = {};

    // Set Location and id in data
    parseResponse(allSitesT).forEach((val) => {
      let { _id } = val;
      if (!data[_id])
        data[_id] = {
          ...val,
          id: _id,
          openingBalance: 0,
          closingBalance: 0,
          trips: 0,
          periodCredit: 0,
          periodDebit: 0,
        };
    });

    // Set Total Trips during the period
    duringAllTripsT.forEach((val) => {
      data[val.id].trips = val.total;
    });

    // Set Opening Balance
    openingCredT.forEach((val) => {
      data[val.id].openingBalance = val.total;
    });

    openingTripT.forEach((val) => {
      data[val.id].openingBalance -= val.total;
    });

    openingOET.forEach((val) => {
      data[val.id].openingBalance -= val.total;
    });

    openingVET.forEach((val) => {
      data[val.id].openingBalance -= val.total;
    });

    // Set Closing Balance
    duringCredT.forEach((val) => {
      data[val.id].periodCredit = val.total;
    });

    duringTripT.forEach((val) => {
      data[val.id].periodDebit += val.total;
    });

    duringOET.forEach((val) => {
      data[val.id].periodDebit += val.total;
    });

    duringVET.forEach((val) => {
      data[val.id].periodDebit += val.total;
    });

    // Update The closing Balance of all sites
    Object.keys(data).forEach((val) => {
      data[val].closingBalance =
        data[val].openingBalance +
        data[val].periodCredit -
        data[val].periodDebit;
    });

    data = Object.values(data);

    if (!data) throw "Record Not Found";

    return res.status(200).json({ data });
  } catch (error) {
    return handleError(res, error);
  }
};

// Download Trips + Office Expense + Vehicle Expense + Receipts of all sites sheet wise
export const downloadAllSitesRokar = async (req, res) => {
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
        diesel: 1,
        dieselIn: 1,
        cash: 1,
        remarks: 1,
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

    let acc = {};

    // Modifyng the Trip
    data[0].forEach((val) => {
      val = val._doc;
      val = {
        ...val,
        diesel: val.dieselIn === "Litre" ? val.diesel : "",
        amount: val.dieselIn === "Amount" ? val.diesel : "",
        addedBy: val?.addedBy?.location ?? "",
        kharcha: val.cash,
        date: dateToString(val.date),
      };
      if (!acc[val.addedBy]) {
        acc[val.addedBy] = [];
      }
      acc[val.addedBy].push(val);
    });

    // Modifying the Vehicle Expense
    data[1].forEach((val) => {
      val = val._doc;
      val = {
        ...val,
        kharcha: val.amount,
        diesel: val.dieselIn === "Litre" ? val.diesel : "",
        amount: val.dieselIn === "Amount" ? val.diesel : "",
        addedBy: val?.addedBy?.location ?? "",
        date: dateToString(val.date),
      };
      if (!acc[val.addedBy]) {
        acc[val.addedBy] = [];
      }
      acc[val.addedBy].push(val);
    });

    // Modifying the Office Expense
    data[2].forEach((val) => {
      val = val._doc;
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        kharcha: val.amount,
        date: dateToString(val.date),
      };
      delete val.amount;
      if (!acc[val.addedBy]) {
        acc[val.addedBy] = [];
      }
      acc[val.addedBy].push(val);
    });

    // Modifying the Receipt
    data[3].forEach((val) => {
      val = val._doc;
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        jama: val.amount,
        date: dateToString(val.date),
      };
      delete val.amount;
      if (!acc[val.addedBy]) {
        acc[val.addedBy] = [];
      }
      acc[val.addedBy].push(val);
    });

    const columns = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Location", "location"),
      columnHeaders("Qty", "quantity"),
      columnHeaders("Diesel(ltr)", "diesel"),
      columnHeaders("Diesel(Amt)", "amount"),
      columnHeaders("Jama", "jama"),
      columnHeaders("Kharcha", "kharcha"),
      columnHeaders("Remarks", "remarks"),
    ];

    return sendExcelFile(
      res,
      Object.keys(acc).map((v) => columns),
      Object.values(acc).map((vl) =>
        vl.sort((a, b) => (a.date > b.date ? 1 : -1))
      ),
      Object.keys(acc)
    );
  } catch (error) {
    return handleError(res, error);
  }
};

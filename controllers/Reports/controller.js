import momentTimezone from "moment-timezone"

import OfficeExpense from "../../models/OfficeExpense.js"
import Receipt from "../../models/Receipt.js"
import Trip from "../../models/Trip.js"
import VehiclesExpense from "../../models/VehiclesExpense.js"
import Diesel from "../../models/Diesel.js"
import {
  handleError,
  parseResponse,
  dateToString,
  columnHeaders,
  userRankQuery,
  formatDateInDDMMYYY
} from "../../utils/utils.js"
import { sendExcelFile } from "../../utils/sendFile.js"
import { INDIA_TZ } from "../../config/constants.js"
import mongoose from "mongoose"
import HardwareShopBill from "../../models/HardwareShopBill.js"
import { createZipFile } from "../../utils/zip.js"
import { createExcelFile } from "../../utils/sendFile.js"

momentTimezone.tz.setDefault(INDIA_TZ)

// Get Excel File Trips + Office Exp + Vehicle Exp
export const getVehiclesReport = async (req, res) => {
  try {
    const user = req.user
    let { from, to } = req.query

    let select = {
      _id: 0,
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      companyAdminId: 0,
    }

    let populate = { path: "addedBy", select: "location" }

    let query = {
      companyAdminId: user.companyAdminId,
      date: { $gte: from, $lte: to },
    }

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
        cash: 1,
        remarks: 1,
        addedBy: 1,
      })
      .populate(populate)
      .sort({ date: 1 })

    let vehicleExpenses = VehiclesExpense.find(query)
      .select(select)
      .populate(populate)

    let officeExpenses = OfficeExpense.find(query)
      .select(select)
      .populate(populate)

    let receipts = Receipt.find(query).select(select).populate(populate)

    const data = await Promise.all([trips, vehicleExpenses, officeExpenses, receipts])

    trips = data[0].map((val) => {
      val = val._doc
      val = {
        ...val,
        diesel: val.dieselIn === "Litre" ? val.diesel : "",
        amount: val.dieselIn === "Amount" ? val.diesel : "",
        addedBy: val?.addedBy?.location ?? "",
        debit: val.cash,
        date: dateToString(val.date),
      }
      delete val.cash
      return val
    })

    vehicleExpenses = data[1].map((val) => {
      val = val._doc
      val = {
        ...val,
        debit: val.amount,
        diesel: val.dieselIn === "Litre" ? val.diesel : "",
        amount: val.dieselIn === "Amount" ? val.diesel : "",
        addedBy: val?.addedBy?.location ?? "",
        date: dateToString(val.date),
      }
      return val
    })

    officeExpenses = data[2].map((val) => {
      val = val._doc
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        debit: val.amount,
        date: dateToString(val.date),
      }
      delete val.amount
      return val
    })

    receipts = data[3].map((val) => {
      val = val._doc
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        credit: val.amount,
        date: dateToString(val.date),
      }
      delete val.amount
      return val
    })

    const columns = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Location", "location"),
      columnHeaders("Qty", "quantity"),
      columnHeaders("Driver", "driverName"),
      columnHeaders("Diesel(ltr)", "diesel"),
      columnHeaders("Diesel(Amt)", "amount"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Credit", "credit"),
      columnHeaders("Debit", "debit"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ]

    return sendExcelFile(
      res,
      [columns],
      [[...trips, ...vehicleExpenses, ...officeExpenses, ...receipts].sort((a, b) => a.date > b.date ? 1 : -1)],
      ["Reports"]
    )
  } catch (error) {
    return handleError(res, error)
  }
}

// Get Whicle vehicle take how much diesel
// and How much diesel from which pump
export const getDieselsReport = async (req, res) => {
  try {
    const user = req.user
    let { from, to } = req.query

    let match = {
      companyAdminId: mongoose.Types.ObjectId(user?.companyAdminId?._id),
      date: { $gte: new Date(from), $lte: new Date(to) },
    }

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
    ])

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
    ])

    const column1 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Owner", "owner"),
    ]

    const column2 = [
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Amount", "amount"),
    ]

    return sendExcelFile(
      res,
      [column1, column2],
      [vehicleWise, pumpWise],
      ["Vehicle Wise Report", "Pump Wise Report"]
    )
  } catch (error) {
    return handleError(res, error)
  }
}

export const getHardwareShopReport = async (req, res) => {
  try {
    const user = req.user
    let { from, to } = req.query

    let match = {
      $match: {
        companyAdminId: mongoose.Types.ObjectId(user?.companyAdminId?._id),
        date: { $gte: new Date(from), $lte: new Date(to) },
      }
    }

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
    ])

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
    ])

    const column1 = [
      columnHeaders("Shop Name", "shopName"),
      columnHeaders("Amount", "amount"),
    ]

    const column2 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Amount", "amount"),
    ]

    return sendExcelFile(
      res,
      [column1, column2],
      [shopWise, vehicleWise],
      ["Shop Report", "Vehicle Report"]
    )
  } catch (error) {
    return handleError(res, error)
  }
}

// Get Trips + Diesel + Vehicle Expense
export const getVehicleDieselReport = async (req, res) => {
  try {
    const user = req.user
    let { from, to } = req.query

    let populate = { path: "addedBy", select: "location" }

    let query = {
      companyAdminId: user.companyAdminId,
      date: { $gte: from, $lte: to },
    }

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
      .sort({ date: 1 })

    trips = parseResponse(trips)

    trips = trips.map((val) => {
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        date: dateToString(val.date),
      }
      return val
    })

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
      .sort({ date: 1 })

    diesel = parseResponse(diesel)
    diesel = diesel.map((val) => {
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        date: dateToString(val.date),
      }
      return val
    })

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
      .sort({ date: 1 })

    vehicleExpenses = parseResponse(vehicleExpenses)

    vehicleExpenses = vehicleExpenses.map((val) => {
      val = {
        ...val,
        addedBy: val?.addedBy?.location ?? "",
        date: dateToString(val.date),
      }
      return val
    })

    const columns = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Diesel", "diesel"),
      columnHeaders("Diesel In", "dieselIn"),
      columnHeaders("Quantity (Pump)", "quantity"),
      columnHeaders("Amount (Pump)", "amount"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Added By", "addedBy"),
    ]

    return sendExcelFile(
      res,
      [columns],
      [[...trips, ...diesel, ...vehicleExpenses]],
      ["Reports"]
    )
  } catch (error) {
    return handleError(res, error)
  }
}

// Get Zip File Containing Excel files as per Vehicle No.
// Excel File contains all Expense on Vehicle including Diesel
// Trips + Diesel + Vehicle Exp
export const downloadAllVehicleWiseReport = async (req, res) => {
  try {
    const user = req.user
    let { from, to } = req.query

    let query = {
      companyAdminId: user.companyAdminId,
      date: { $gte: from, $lte: to },
    }

    let select = {
      _id: 0,
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      companyAdminId: 0,
      addedBy: 0
    }

    let tripsData = Trip.find(query)
      .select({ ...select, diNo: 0, lrNo: 0, partyName: 0, bags: 0, driverPhone: 0, rate: 0, billingRate: 0 })
      .sort({ date: 1 })

    let expenseData = VehiclesExpense.find(query)
      .select({ ...select })
      .sort({ date: 1 })

    let dieselData = Diesel.find(query)
      .select({ ...select })
      .sort({ date: 1 })

    let data = await Promise.all([tripsData, expenseData, dieselData])
    tripsData = parseResponse(data[0])
    expenseData = parseResponse(data[1])
    dieselData = parseResponse(data[2])

    // Will be used to map the vehicle number
    data = {}

    let tempPromise = []

    // First Trip, Key will be last 4 digit of vehicle no.
    tripsData.forEach(val => {
      const vehicleNo = val.vehicleNo.substr(-4)

      // If new Vehicle No.
      if (!data[vehicleNo]) data[vehicleNo] = []

      data[vehicleNo].push({
        ...val,
        date: formatDateInDDMMYYY(val.date),
        amount: val.cash
      })
    })

    // Then Expense
    expenseData.forEach(val => {
      const vehicleNo = val.vehicleNo.substr(-4)

      // If new Vehicle No.
      if (!data[vehicleNo]) data[vehicleNo] = []

      data[vehicleNo].push({
        ...val,
        date: formatDateInDDMMYYY(val.date),
      })
    })

    // Then Diesel
    dieselData.forEach(val => {
      const vehicleNo = val.vehicleNo.substr(-4)

      // If new Vehicle No.
      if (!data[vehicleNo]) data[vehicleNo] = []

      data[vehicleNo].push({
        ...val,
        quantity: "", // as we are giving other name to these
        pumpName: "",
        amount: "",
        date: formatDateInDDMMYYY(val.date),
        dieselFromPump: val.quantity,
        amountFromPump: val.amount,
        pumpNameFromPump: val.pumpName,
      })
    })

    // Preparing the Excel WorkBook for vehicles
    const column1 = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Loading Point", "loadingPoint"),
      columnHeaders("Locatin", "location"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Material", "material"),
      columnHeaders("Driver Name", "driverName"),
      columnHeaders("Diesel", "diesel"),
      columnHeaders("Diesel In", "dieselIn"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Quantity (Bill)", "dieselFromPump"),
      columnHeaders("Amount (Bill)", "amountFromPump"),
      columnHeaders("Pump Name (Bill)", "pumpNameFromPump"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Remarks", "remarks"),
    ]

    let excelFiles = []

    const vehicleNoList = Object.keys(data)
    console.log("List of Vehicle No. ", vehicleNoList)

    vehicleNoList.forEach(vehicleNo => {
      excelFiles.push(createExcelFile([column1], [data[vehicleNo]], [vehicleNo]).xlsx.writeBuffer())
    })

    excelFiles = await Promise.all(excelFiles)

    console.log("Excel Files had been created")

    excelFiles = excelFiles.map((file, index) => {
      return {
        file,
        fileName: vehicleNoList[index] + ".xlsx"
      }
    })

    const files = await createZipFile(excelFiles)

    console.log("Zip File had been created")

    const fileName = 'reports.zip';
    const fileType = 'application/zip';


    res.writeHead(200, {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': fileType,
    })

    return res.end(files);

    //return res.status(200).json({ data })
  }
  catch (error) {
    return handleError(res, error)
  }
}

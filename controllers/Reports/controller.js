import moment from "moment"
import momentTimezone from "moment-timezone"

import OfficeExpense from "../../models/OfficeExpense.js"
import Receipt from "../../models/Receipt.js"
import Trip from "../../models/Trip.js"
import VehiclesExpense from "../../models/VehiclesExpense.js"
import Diesel from "../../models/Diesel.js"
import { handleError, parseResponse, dateToString } from "../../utils/utils.js"
import { sendExcelFile } from "../../utils/sendFile.js"
import { INDIA_TZ } from "../../config/constants.js"
import mongoose from "mongoose"

momentTimezone.tz.setDefault(INDIA_TZ)

const columnHeaders = (header, key, width = 15) => {
  return { header, key, width }
}

export const getVehiclesReport = async (req, res) => {
  try {
    const user = req.user
    let { from = moment().startOf("month"), to = moment() } = req.query
    from = moment(from).startOf("day").toISOString()
    to = moment(to).endOf("day").toISOString()

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

    let trips = await Trip.find(query)
      .select({
        _id: 0,
        date: 1,
        location: 1,
        vehicleNo: 1,
        quantity: 1,
        pumpName: 1,
        diesel: 1,
        dieselIn: 1,
        cash: 1,
        remarks: 1,
        addedBy: 1,
      })
      .populate(populate)
      .sort({ date: 1 })

    trips = parseResponse(trips)

    trips = trips.map((val) => {
      val = {
        ...val,
        diesel: val.dieselIn === "Litre" ? val.diesel : "",
        amount: val.dieselIn === "Amount" ? val.diesel : "",
        addedBy: val.addedBy ? val.addedBy.location : "",
        debit: val.cash,
        date: dateToString(val.date),
      }
      delete val.cash
      return val
    })

    let vehicleExpenses = await VehiclesExpense.find(query)
      .select(select)
      .populate(populate)

    vehicleExpenses = parseResponse(vehicleExpenses)

    vehicleExpenses = vehicleExpenses.map((val) => {
      val = {
        ...val,
        debit: val.amount,
        diesel: val.dieselIn === "Litre" ? val.diesel : "",
        amount: val.dieselIn === "Amount" ? val.diesel : "",
        addedBy: val.addedBy ? val.addedBy.location : "",
        date: dateToString(val.date),
      }
      return val
    })

    let officeExpenses = await OfficeExpense.find(query)
      .select(select)
      .populate(populate)

    officeExpenses = parseResponse(officeExpenses)

    officeExpenses = officeExpenses.map((val) => {
      val = {
        ...val,
        addedBy: val.addedBy ? val.addedBy.location : "",
        debit: val.amount,
        date: dateToString(val.date),
      }
      delete val.amount
      return val
    })

    let receipts = await Receipt.find(query).select(select).populate(populate)

    receipts = parseResponse(receipts)

    receipts = receipts.map((val) => {
      val = {
        ...val,
        addedBy: val.addedBy ? val.addedBy.location : "",
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
      [[...trips, ...vehicleExpenses, ...officeExpenses, ...receipts]],
      ["Reports"]
    )
  } catch (error) {
    return handleError(res, error)
  }
}

export const getDieselsReport = async (req, res) => {
  try {
    const user = req.user
    let { from = moment().startOf("month"), to = moment() } = req.query
    from = moment(from).startOf("day").toISOString()
    to = moment(to).endOf("day").toISOString()

    let match = {
      companyAdminId: mongoose.Types.ObjectId(user?.companyAdminId?._id),
      date: { $gte: new Date(from), $lte: new Date(to) },
    }

    let vehicleWise = await Diesel.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: {
            vehicleNo: "$vehicleNo",
          },
          quantity: { $sum: "$quantity" },
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          vehicleNo: "$_id.vehicleNo",
          quantity: 1,
          amount: 1,
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
    ])

    const column1 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Amount", "amount"),
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

import moment from "moment"
import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  userRankQuery,
  columnHeaders,
  parseResponse,
  formatDateInDDMMYYY,
  validateDateWhileUpload,
} from "../../utils/utils.js"
import VehiclesExpense from "../../models/VehiclesExpense.js"
import { INDIA_TZ } from "../../config/constants.js"
import { sendExcelFile } from "../../utils/sendFile.js"
import { fileHeader, modelHeader, validateArr } from "./constants.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getExpenses = async (req, res) => {
  try {
    const user = req.user
    const userQuery = userRankQuery(user)
    let { expenseId, from, to } = req.query

    let expenses
    if (expenseId) {
      expenses = await VehiclesExpense.findOne({ _id: expenseId })
    } else {
      expenses = await VehiclesExpense.find({
        ...userQuery,
        date: { $gte: from, $lte: to },
      })
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ date: -1 })

      expenses = parseResponse(expenses)
      expenses = expenses.map((val) => {
        return {
          ...val,
          date: formatDateInDDMMYYY(val.date),
          addedBy: val?.addedBy?.location,
        }
      })
    }

    if (!expenses) throw "Record Not Found"

    return res.status(200).json({ data: expenses })
  } catch (error) {
    return handleError(res, error)
  }
}

export const uploadExpenses = async (req, res) => {
  try {
    const user = req.user

    let dataToBeInsert = req.body.data

    let data = []

    for (let i = 0; i < dataToBeInsert.length; i++) {
      const item = dataToBeInsert[i]
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId }
      let mssg = ""

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index]
        let value = item[fileHeader[index]]

        if (index < 5 && !value) mssg = `Enter Valid ${fileHeader[index]}`

        if (
          item["Diesel"] &&
          head === "dieselIn" &&
          value !== "Litre" &&
          value !== "Amount"
        )
          mssg = `Diesel In should be Litre or Amount `
        else if (item["Diesel"] && !item["Pump Name"])
          mssg = `Pump Name is mandatory if Diesel Taken`

        if (mssg) throw mssg

        if (head === "date") {
          value = validateDateWhileUpload(value)
        }

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await VehiclesExpense.insertMany(data)

    return res.status(200).json({
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const addExpenses = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      const { diesel, dieselIn, pumpName } = req.body

      if (diesel && dieselIn !== "Litre" && dieselIn !== "Amount")
        throw "Diesel In should be in Litre or Amount"

      if (diesel && !pumpName) throw "Pump Name is Mandatory if Diesel Taken"

      const insertData = await VehiclesExpense.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res.status(200).json({
        data: insertData,
        message: "Vehicles Expenses Added Successfully",
      })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const editExpenses = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      const { diesel, dieselIn, pumpName, _id: expenseId } = req.body

      if (diesel && dieselIn !== "Litre" && dieselIn !== "Amount")
        throw "Diesel In should be in Litre or Amount"

      if (diesel && !pumpName) throw "Pump Name is Mandatory if Diesel Taken"

      const updateData = await VehiclesExpense.findByIdAndUpdate(
        { _id: expenseId },
        req.body
      )

      if (!updateData) throw "Record Not Found"

      return res.status(200).json({
        data: updateData,
        message: "Vehicles Expense Edited Successfully",
      })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const deleteExpenses = async (req, res) => {
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }
    const expenseIds = req.body

    const deletedData = await VehiclesExpense.deleteMany({ _id: expenseIds })

    return res.status(200).json({
      message: `Vehicles Expense${
        expenseIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadExpenses = async (req, res) => {
  try {
    const userQuery = userRankQuery(req.user)
    const { from, to } = req.query
    let data = await VehiclesExpense.find({
      ...userQuery,
      date: { $gte: from, $lte: to },
    })
      .select({ _id: 0, __v: 0, companyAdminId: 0, createdAt: 0, updatedAt: 0 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ date: 1 })

    data = parseResponse(data)

    data = data.map((val) => {
      return {
        ...val,
        date: formatDateInDDMMYYY(val.date),
        addedBy: val?.addedBy?.location,
      }
    })

    const column1 = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Driver Name", "driverName"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Diesel", "dieselIn"),
      columnHeaders("Diesel In", "dieselIn"),
      columnHeaders("Diesel For", "dieselFor"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ]
    return sendExcelFile(res, [column1], [data], ["Vehicle Expenses"])
  } catch (error) {
    return handleError(res, error)
  }
}

import moment from "moment"
import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  userRankQuery,
} from "../../utils/utils.js"
import VehiclesExpense from "../../models/VehiclesExpense.js"
import { INDIA_TZ } from "../../config/constants.js"

momentTimezone.tz.setDefault(INDIA_TZ)

const fileHeader = [
  "Date",
  "Vehicle No.",
  "Driver Name",
  "Amount",
  "Remarks",
  "Pump Name",
  "Diesel",
  "Diesel In",
  "Diesel For",
]

const modelHeader = [
  "date",
  "vehicleNo",
  "driverName",
  "amount",
  "remarks",
  "pumpName",
  "diesel",
  "dieselIn",
  "dieselFor",
]

export const getExpenses = async (req, res) => {
  try {
    const user = req.user
    const userQuery = userRankQuery(user)
    let {
      expenseId,
      from = moment().startOf("month"),
      to = moment(),
    } = req.query
    from = moment(from).startOf("day").toISOString()
    to = moment(to).endOf("day").toISOString()

    let expenses
    if (expenseId) {
      expenses = await VehiclesExpense.findOne({ _id: expenseId })
    } else
      expenses = await VehiclesExpense.find({
        ...userQuery,
        date: { $gte: from, $lte: to },
      })
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ date: -1 })

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

        if (head === "date") value = moment(value, "DD-MM-YYYY").toISOString()

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await VehiclesExpense.insertMany(data)

    return res.status(200).json({
      data: insertData,
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const addExpenses = [
  validateBody(["date", "vehicleNo", "driverName", "amount", "remarks"]),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

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
  validateBody(["date", "vehicleNo", "driverName", "amount", "remarks"]),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      const expenseId = req.body._id
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
    const user = req.user
    const expenseIds = req.body

    const deletedData = await VehiclesExpense.deleteMany({ _id: expenseIds })

    return res.status(200).json({
      data: deletedData,
      message: `Vehicles Expense${
        expenseIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

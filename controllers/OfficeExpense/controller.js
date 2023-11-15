import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  userRankQuery,
  parseResponse,
  formatDateInDDMMYYY,
  columnHeaders,
  validateDateWhileUpload,
} from "../../utils/utils.js"
import OfficeExpense from "../../models/OfficeExpense.js"
import { sendExcelFile } from "../../utils/sendFile.js"
import { INDIA_TZ } from "../../config/constants.js"

momentTimezone.tz.setDefault(INDIA_TZ)

const fileHeader = ["Date", "Amount", "Remarks"]

const modelHeader = ["date", "amount", "remarks"]

export const getExpenses = async (req, res) => {
  try {
    const user = req.user
    let { expenseId, from, to } = req.query

    const userQuery = userRankQuery(user)
    let expenses
    if (expenseId) {
      expenses = await OfficeExpense.findOne({
        _id: expenseId,
        companyAdminId: user.companyAdminId,
      })
    } else {
      expenses = await OfficeExpense.find({
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
  const session = await OfficeExpense.startSession()
  try {
    session.startTransaction()
    const user = req.user

    let dataToBeInsert = req.body.data

    let data = []

    for (let ind = 0; ind < dataToBeInsert.length; ind++) {
      const item = dataToBeInsert[ind]
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId }
      let mssg = ""

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index]
        let value = item[fileHeader[index]]

        if (!value) mssg = `Enter Valid ${fileHeader[index]} for row no. ${ind + 2}`

        if (mssg) throw mssg

        if (head === "date") {
          value = validateDateWhileUpload(value, ind)
        }

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    console.log("Data : ", data)
    const insertData = await OfficeExpense.insertMany(data, { session })
    await session.commitTransaction()

    return res.status(200).json({
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    })
  } catch (error) {
    await session.abortTransaction()
    return handleError(res, error)
  } finally {
    session.endSession()
  }
}

export const addExpenses = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      await OfficeExpense.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res.status(200).json({
        message: "Office Expenses Added Successfully",
      })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const editExpenses = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      const expenseId = req.body._id
      const updateData = await OfficeExpense.findByIdAndUpdate(
        { _id: expenseId },
        req.body
      )

      if (!updateData) throw "Record Not Found"

      return res.status(200).json({
        data: updateData,
        message: "Office Expense Edited Successfully",
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

    const deletedData = await OfficeExpense.deleteMany({ _id: expenseIds })

    return res.status(200).json({
      data: deletedData,
      message: `Office Expense${expenseIds.length > 1 ? "s" : ""
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
    let data = await OfficeExpense.find({
      ...userQuery,
      date: { $gte: from, $lte: to },
    })
      .select({ addedBy: 1, amount: 1, date: 1, remarks: 1 })
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
      columnHeaders("Amount", "amount"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ]
    return sendExcelFile(res, [column1], [data], ["Office Expenses"])
  } catch (error) {
    return handleError(res, error)
  }
}

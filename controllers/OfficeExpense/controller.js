import moment from "moment"
import {
  handleError,
  errorValidation,
  validateBody,
  userRankQuery,
} from "../../utils/utils.js"
import OfficeExpense from "../../models/OfficeExpense.js"

const fileHeader = ["Date", "Amount", "Remarks"]

const modelHeader = ["date", "amount", "remarks"]

export async function getExpenses(req, res) {
  try {
    const user = req.user
    const { expenseId } = req.query
    const userQuery = userRankQuery(user)
    let expenses
    if (expenseId) {
      expenses = await OfficeExpense.findOne({ _id: expenseId })
    } else
      expenses = await OfficeExpense.find(userQuery)
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

export async function uploadExpenses(req, res) {
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

        if (!value) mssg = `Enter Valid ${fileHeader[index]}`

        if (mssg) throw mssg

        if (head === "date") value = moment(value, "DD-MM-YYYY").toISOString()

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await OfficeExpense.insertMany(data)

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
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      const insertData = await OfficeExpense.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res.status(200).json({
        data: insertData,
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
      const user = req.user

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

export async function deleteExpenses(req, res) {
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
      message: `Office Expense${
        expenseIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

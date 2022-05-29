import md5 from "md5"
import {
  handleError,
  errorValidation,
  validateBody,
  validatePhoneNo,
  userRankQuery,
} from "../../utils/utils.js"
import Account from "../../models/Account.js"

const modelHeader = ["userName", "password", "location"]

export const getAccount = async (req, res) => {
  try {
    const user = req.user
    const { accountId } = req.query
    let accounts
    if (accountId)
      accounts = await Account.findById({ _id: accountId }).select({
        password: 0,
      })
    else
      accounts = await Account.find(userRankQuery(user)).select({
        password: 0,
      })
    if (!accounts) throw "This Account does not exist in our record"

    return res.status(200).json({ data: accounts })
  } catch (error) {
    return handleError(res, error)
  }
}

export const addAccount = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user
      if (req.body.password) req.body.password = md5(req.body.password)
      if (req.body.phone && !validatePhoneNo(req.body.phone))
        throw "Enter Valid Phone No."

      const insertData = await Account.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res
        .status(200)
        .json({ data: insertData, message: "Account Added Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const editAccount = [
  validateBody(["userName", "location"]),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      if (req.body.password && req.body.password.length)
        req.body.password = md5(req.body.password)
      else delete req.body.password

      const accountId = req.body._id
      const updateData = await Account.findByIdAndUpdate(
        { _id: accountId },
        req.body
      )

      if (!updateData) throw "Record Not Found"

      return res
        .status(200)
        .json({ data: updateData, message: "Account Edited Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const deleteAccount = async (req, res) => {
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }
    const user = req.user
    const accountIds = req.body

    const deletedData = await Account.deleteMany({ _id: accountIds })

    return res.status(200).json({
      data: deletedData,
      message: `Account${
        accountIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

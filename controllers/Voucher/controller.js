import mongoose from "mongoose"
import moment from "moment"
import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
} from "../../utils/utils.js"
import Voucher from "../../models/Voucher.js"
import {
  aggregateBody,
  validateArr,
  modelHeader,
  fileHeader,
} from "./constants.js"
import { INDIA_TZ } from "../../config/constants.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getVoucher = async (req, res) => {
  try {
    const user = req.user
    let {
      voucherId,
      from = moment().startOf("month"),
      to = moment(),
    } = req.query
    from = moment(from).startOf("day").toISOString()
    to = moment(to).endOf("day").toISOString()

    let vouchers
    if (voucherId) {
      vouchers = await Voucher.aggregate([
        {
          $match: {
            _id: mongoose.Types.ObjectId(voucherId),
            companyAdminId: mongoose.Types.ObjectId(user.companyAdminId._id),
          },
        },
        ...aggregateBody,
      ])
      vouchers = vouchers[0]
    } else
      vouchers = await Voucher.aggregate([
        {
          $match: {
            companyAdminId: mongoose.Types.ObjectId(user?.companyAdminId?._id),
            date: { $gte: new Date(from), $lte: new Date(to) },
          },
        },
        ...aggregateBody,
      ])

    if (!vouchers) throw "Record Not Found"

    return res.status(200).json({ data: vouchers })
  } catch (error) {
    return handleError(res, error)
  }
}

export const addVoucher = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      const insertData = await Voucher.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res.status(200).json({
        data: insertData,
        message: "Voucher Added Successfully",
      })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const uploadVoucher = async (req, res) => {
  try {
    const user = req.user

    const dataToBeInsert = req.body.data

    let data = []

    for (let i = 0; i < dataToBeInsert.length; i++) {
      const item = dataToBeInsert[i]
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId }
      let mssg = ""

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index]
        let value = item[fileHeader[index]]

        if (index < 6 && !value) mssg = `Enter Valid ${fileHeader[index]}`

        if (mssg) throw mssg

        if (head === "date") value = moment(value, "DD-MM-YYYY").toISOString()

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await Voucher.insertMany(data)

    return res.status(200).json({
      data: insertData,
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const editVoucher = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      const voucherId = req.body._id
      const updateData = await Voucher.findByIdAndUpdate(
        { _id: voucherId },
        req.body
      )

      if (!updateData) throw "Record Not Found"

      return res.status(200).json({
        data: updateData,
        message: "Vocher Edited Successfully",
      })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const deleteVoucher = async (req, res) => {
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }

    const voucherIds = req.body

    const deletedData = await Voucher.deleteMany({ _id: voucherIds })

    return res.status(200).json({
      data: deletedData,
      message: `Voucher${
        voucherIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

import mongoose from "mongoose"
import moment from "moment"
import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  formatDateInDDMMYYY,
  columnHeaders,
  parseResponse,
} from "../../utils/utils.js"
import Voucher from "../../models/Voucher.js"
import {
  aggregateBody,
  validateArr,
  modelHeader,
  fileHeader,
} from "./constants.js"
import { sendExcelFile } from "../../utils/sendFile.js"
import { INDIA_TZ } from "../../config/constants.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getVoucher = async (req, res) => {
  try {
    const user = req.user
    let { voucherId, from, to } = req.query

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

      await Voucher.create({
        ...req.body,
        addedBy: req?.user?._id,
        companyAdminId: req?.user?.companyAdminId,
      })

      return res.status(200).json({
        message: "Voucher Added Successfully",
      })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const uploadVoucher = async (req, res) => {
  const session = await Voucher.startSession()
  try {
    session.startTransaction()

    const dataToBeInsert = req.body.data

    let data = []

    for (let i = 0; i < dataToBeInsert.length; i++) {
      const item = dataToBeInsert[i]
      let tempVal = {
        addedBy: req?.user?._id,
        companyAdminId: req?.user?.companyAdminId,
      }
      let mssg = ""

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index]
        let value = item[fileHeader[index]]

        if (index < 6 && !value) mssg = `Enter Valid ${fileHeader[index]}`

        // These fields are Cash, TDS, Amount ....
        if (!value && (index >= 7 || index <= 11)) value = 0

        if (mssg) throw mssg

        if (head === "date") value = moment(value, "DD-MM-YYYY").toISOString()

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await Voucher.insertMany(data, { session })

    await session.commitTransaction()

    return res.status(200).json({
      data: insertData,
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

export const editVoucher = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      const updateData = await Voucher.findByIdAndUpdate(
        { _id: req.body._id },
        req.body
      )
      if (!updateData) throw "Record Not Found"

      return res.status(200).json({
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

    await Voucher.deleteMany({ _id: voucherIds })

    return res.status(200).json({
      message: `Successfully Deleted ${voucherIds.length} Voucher${
        voucherIds.length > 1 ? "s" : ""
      }`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadVouchers = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    const { from, to } = req.query
    let data = await Voucher.aggregate([
      {
        $match: {
          companyAdminId: mongoose.Types.ObjectId(companyAdminId?._id),
          date: { $gte: new Date(from), $lte: new Date(to) },
        },
      },
      ...aggregateBody,
    ])

    data = parseResponse(data)

    data = data.map((val) => {
      return {
        ...val,
        date: formatDateInDDMMYYY(val.date),
        diDate: formatDateInDDMMYYY(val?.trip?.date),
        vehicleNo: val?.trip?.vehicleNo,
        lrNo: val?.trip?.lrNo,
        designation: val?.trip?.location,
        quantity: val?.trip?.quantity,
        site: val?.trip?.addedBy?.branch,
        addedBy: val?.addedBy?.location,
      }
    })

    const column1 = [
      columnHeaders("Date", "date"),
      columnHeaders("DI No.", "diNo"),
      columnHeaders("Billing Rate", "billingRate"),
      columnHeaders("Rate", "rate"),
      columnHeaders("Paid To", "paidTo"),
      columnHeaders("Account No.", "accountNo"),
      columnHeaders("IFSC", "ifsc"),
      columnHeaders("Cash", "cash"),
      columnHeaders("Diesel", "diesel"),
      columnHeaders("Advance", "advance"),
      columnHeaders("TDS", "tds"),
      columnHeaders("Shortage", "shortage"),
      columnHeaders("Other", "other"),
      columnHeaders("DI Date", "diDate"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("LR No.", "lrNo"),
      columnHeaders("Designation", "designation"),
      columnHeaders("Site", "site"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("AddedBy", "addedBy"),
    ]
    return sendExcelFile(res, [column1], [data], ["Documents"])
  } catch (error) {
    return handleError(res, error)
  }
}

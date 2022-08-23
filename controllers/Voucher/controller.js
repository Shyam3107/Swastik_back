import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  formatDateInDDMMYYY,
  columnHeaders,
  parseResponse,
  validateDateWhileUpload,
} from "../../utils/utils.js"
import Trip from "../../models/Trip.js"
import Voucher from "../../models/Voucher.js"
import {
  validateArr,
  modelHeader,
  fileHeader,
  populateVoucherWithTotal,
  diSelect,
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
      vouchers = await Voucher.findById({ _id: voucherId })
        .select({
          createdAt: 0,
          __v: 0,
          companyAdminId: 0,
          updatedAt: 0,
        })
        .populate({
          path: "diNo",
          select: diSelect,
          populate: { path: "addedBy", select: "branch" },
        })
        .populate({ path: "addedBy", select: "location" })
      vouchers = parseResponse(vouchers)
      vouchers = populateVoucherWithTotal(vouchers)
    } else {
      vouchers = await Voucher.find({
        date: { $gte: from, $lte: to },
        companyAdminId: user.companyAdminId,
      })
        .select({
          createdAt: 0,
          __v: 0,
          companyAdminId: 0,
          updatedAt: 0,
        })
        .populate({
          path: "diNo",
          select: diSelect,
          populate: { path: "addedBy", select: "branch" },
        })
        .populate({ path: "addedBy", select: "location" })

      vouchers = parseResponse(vouchers)
      vouchers = vouchers.map((val) => {
        return {
          ...val,
          date: formatDateInDDMMYYY(val.date),
          addedBy: val?.addedBy?.location,
          billingRate: val?.diNo?.billingRate,
          rate: val?.diNo?.rate,
          cash: val?.diNo?.cash,
          diesel:
            val?.diNo?.dieselIn === "Litre"
              ? val.diNo.diesel * val?.dieselRate
              : val?.diNo?.diesel,
          diNo: val?.diNo?.diNo,
          paidOn: val?.paidOn ? formatDateInDDMMYYY(val?.paidOn) : val?.paidOn,
        }
      })
    }

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
      const companyAdminId = req?.user?.companyAdminId
      const { diNo } = req.body

      const record = await Trip.findOne({ diNo, companyAdminId }).select({
        _id: 1,
        diesel: 1,
        dieselIn: 1,
      })
      if (!record) throw "DI No. doesn't exist in our record."

      // If Diesel In is in Litre, then Diesel Rate is Required
      let { dieselRate } = req.body
      dieselRate = dieselRate ? parseFloat(dieselRate) : 0
      if (
        record?._doc?.dieselIn === "Litre" &&
        !dieselRate &&
        record?._doc?.diesel
      ) {
        throw "Diesel Rate is required as Vehicle as taken Diesel in Litre"
      }

      await Voucher.create({
        ...req.body,
        diNo: record._id,
        addedBy: req?.user?._id,
        companyAdminId,
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

    const companyAdminId = req?.user?.companyAdminId

    const dataToBeInsert = req.body.data

    let data = []
    let tempDiNo = {}

    for (let ind = 0; ind < dataToBeInsert.length; ind++) {
      const item = dataToBeInsert[ind]
      let tempVal = {
        addedBy: req?.user?._id,
        companyAdminId,
      }
      let mssg = ""

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index]
        let value = item[fileHeader[index]]

        // Check for same DI No. wihin excel sheet
        if (head === "diNo") {
          if (tempDiNo[value]) mssg = `Two rows can't have same DI No- ${value}`
          tempDiNo[value] = true
        }

        if (index <= 3 && !value) {
          mssg = `Enter Valid ${fileHeader[index]} for row: ${ind + 2}`
        }

        // These fields are TDS, Shortage, Other
        if (!value && (index >= 5 || index < 8)) value = 0

        if (mssg) throw mssg

        if (head === "date") {
          value = validateDateWhileUpload(value, ind)
        }

        if (value && head === "paidOn") {
          value = validateDateWhileUpload(value, ind)
        }

        tempVal[head] = value
      }

      // Change DI No. to its id
      const voucherDino = await Trip.findOne({
        diNo: tempVal.diNo,
        companyAdminId,
      }).select({ _id: 1, diesel: 1, dieselIn: 1 })

      if (!voucherDino) {
        throw `DI NO.: ${tempVal.diNo} doesn't exist in our record in row: ${
          ind + 2
        }`
      }

      // If Diesel In is in Litre, then Diesel Rate is Required
      let { dieselIn, diesel } = voucherDino._doc
      tempVal.dieselRate = tempVal.dieselRate
        ? parseFloat(tempVal.dieselRate)
        : 0
      if (dieselIn === "Litre" && !tempVal.dieselRate && diesel) {
        throw `Diesel Rate is required as Vehicle as taken Diesel in Litre for DI No :${
          tempVal.diNo
        } in row: ${ind + 2}`
      }

      tempVal.diNo = voucherDino._id

      data.push(tempVal)
    }

    const insertData = await Voucher.insertMany(data, { session })

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

export const editVoucher = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      const companyAdminId = req?.user?.companyAdminId
      const { diNo } = req.body

      const record = await Trip.findOne({ diNo, companyAdminId }).select({
        _id: 1,
        diesel: 1,
        dieselIn: 1,
      })
      if (!record) throw "DI No. doesn't exist in our record."

      // If Diesel In is in Litre, then Diesel Rate is Required
      let { dieselRate } = req.body
      dieselRate = dieselRate ? parseFloat(dieselRate) : 0
      if (
        record?._doc?.dieselIn === "Litre" &&
        !dieselRate &&
        record?._doc?.diesel
      ) {
        throw "Diesel Rate is required as Vehicle as taken Diesel in Litre"
      }

      // Update the DI No. if changed else old will be there
      req.body.diNo = record._id

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
    let data = await Voucher.find({
      date: { $gte: from, $lte: to },
      companyAdminId,
    })
      .select({
        createdAt: 0,
        __v: 0,
        companyAdminId: 0,
        updatedAt: 0,
      })
      .populate({
        path: "diNo",
        select: diSelect,
        populate: { path: "addedBy", select: "branch" },
      })
      .populate({ path: "addedBy", select: "location" })

    data = parseResponse(data)

    data = data.map((val) => {
      val = populateVoucherWithTotal(val)
      return {
        ...val,
        paidOn: val?.paidOn ? formatDateInDDMMYYY(val.paidOn) : "",
        diDate: formatDateInDDMMYYY(val?.diDate),
        date: formatDateInDDMMYYY(val?.date),
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
      columnHeaders("Diesel (Qty)", "dieselQty"),
      columnHeaders("Diesel In", "dieselIn"),
      columnHeaders("Diesel", "diesel"),
      columnHeaders("TDS (%)", "tds"),
      columnHeaders("Shortage", "shortage"),
      columnHeaders("Other", "other"),
      columnHeaders("Total", "total"),
      columnHeaders("DI Date", "diDate"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("LR No.", "lrNo"),
      columnHeaders("Designation", "designation"),
      columnHeaders("Site", "site"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Paid On", "paidOn"),
      columnHeaders("AddedBy", "addedBy"),
    ]
    return sendExcelFile(res, [column1], [data], ["Documents"])
  } catch (error) {
    return handleError(res, error)
  }
}

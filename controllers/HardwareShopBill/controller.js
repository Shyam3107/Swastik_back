import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  columnHeaders,
  parseResponse,
  formatDateInDDMMYYY,
  validateDateWhileUpload,
} from "../../utils/utils.js"
import { INDIA_TZ } from "../../config/constants.js"
import { fileHeader, modelHeader, validateArr } from "./constants.js"
import { sendExcelFile } from "../../utils/sendFile.js"
import HardwareShopBill from "../../models/HardwareShopBill.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getBills = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    let { billId, from, to } = req.query

    let data
    if (billId) {
      data = await HardwareShopBill.findById({
        _id: billId,
        companyAdminId,
      }).select({ date: 1, vehicleNo: 1, shopName: 1, amount: 1, remarks: 1 })
    } else {
      data = await HardwareShopBill.find({
        companyAdminId,
        date: { $gte: from, $lte: to },
      })
        .select({
          date: 1,
          vehicleNo: 1,
          shopName: 1,
          addedBy: 1,
          amount: 1,
          remarks: 1,
        })
        .populate({ path: "addedBy", select: "location" })
        .sort({ date: -1 })
      data = parseResponse(data)
      data = data.map((val) => {
        return {
          ...val,
          date: formatDateInDDMMYYY(val.date),
          addedBy: val?.addedBy?.location,
        }
      })
    }

    if (!data) throw "Record Not Found"

    return res.status(200).json({ data })
  } catch (error) {
    return handleError(res, error)
  }
}

export const getUniqueShop = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId

    let data = await HardwareShopBill.find({
      companyAdminId,
    })
      .select({ shopName: 1, _id: 0 })
      .sort({ shopName: 1 })
      .distinct("shopName")

    if (!data) throw "Record Not Found"

    return res.status(200).json({ data })
  } catch (error) {
    return handleError(res, error)
  }
}

export const uploadBills = async (req, res) => {
  const session = await HardwareShopBill.startSession()
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
        const head = modelHeader[index]
        let value = item[fileHeader[index]]

        if (head === "date") {
          value = validateDateWhileUpload(value, ind)
        }

        if (mssg) throw mssg

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await HardwareShopBill.insertMany(data, { session })
    await session.commitTransaction()

    return res.status(200).json({
      message: `Successfully Inserted ${insertData.length} entries`,
    })
  } catch (error) {
    await session.abortTransaction()
    return handleError(res, error)
  } finally {
    session.endSession()
  }
}

export const addBills = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      await HardwareShopBill.create({
        ...req.body,
        addedBy: req?.user?._id,
        companyAdminId: req?.user?.companyAdminId,
      })

      return res.status(200).json({ message: "Bill Added Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const editBills = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      const billId = req.body._id

      const updateData = await HardwareShopBill.findByIdAndUpdate(
        { _id: billId },
        req.body
      )

      if (!updateData) throw "Record Not Found"

      return res.status(200).json({ message: "Bill Edited Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const deleteBills = async (req, res) => {
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }

    const billIds = req.body

    await HardwareShopBill.deleteMany({ _id: billIds })

    return res.status(200).json({
      message: `Successfully Deleted ${billIds.length} Bill${
        billIds.length > 1 ? "s" : ""
      }`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadBills = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    let { from, to } = req.query

    let data = await HardwareShopBill.find({
      companyAdminId,
      date: { $gte: from, $lte: to },
    })
      .select({
        date: 1,
        vehicleNo: 1,
        shopName: 1,
        addedBy: 1,
        amount: 1,
        remarks: 1,
      })
      .populate({ path: "addedBy", select: "location" })
      .sort({ date: 1 })

    data = parseResponse(data)

    data = data.map((val) => {
      return {
        ...val,
        date: formatDateInDDMMYYY(val?.date),
        addedBy: val?.addedBy?.location,
      }
    })

    const column1 = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Shop Name", "shopName"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("AddedBy", "addedBy"),
    ]

    return sendExcelFile(res, [column1], [data], ["Bills"])
  } catch (error) {
    return handleError(res, error)
  }
}

export const getBillsByVehicle = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    let { vehicleNo, from, to } = req.query

    let data = await HardwareShopBill.find({
      vehicleNo,
      companyAdminId,
      date: { $gte: from, $lte: to },
    })
      .select({
        date: 1,
        vehicleNo: 1,
        shopName: 1,
        addedBy: 1,
        amount: 1,
        remarks: 1,
      })
      .populate({ path: "addedBy", select: "location" })
      .sort({ date: -1 })

    if (!data) throw "Record Not Found"

    let totalAmount = 0
    data = parseResponse(data)
    data = data.map((val) => {
      totalAmount += val?.amount
      return {
        ...val,
        date: formatDateInDDMMYYY(val.date),
        addedBy: val?.addedBy?.location,
      }
    })

    return res.status(200).json({ data: { data, totalAmount } })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadBillsByVehicle = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    let { vehicleNo, from, to } = req.query

    let data = await HardwareShopBill.find({
      companyAdminId,
      vehicleNo,
      date: { $gte: from, $lte: to },
    })
      .select({
        _id: 0,
        date: 1,
        vehicleNo: 1,
        shopName: 1,
        addedBy: 1,
        amount: 1,
        remarks: 1,
      })
      .populate({ path: "addedBy", select: "location" })
      .sort({ date: 1 })

    if (!data) throw "Record Not Found"

    data = parseResponse(data)

    data = data.map((val) => {
      return {
        ...val,
        date: formatDateInDDMMYYY(val?.date),
        addedBy: val?.addedBy?.location,
      }
    })

    const column1 = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Shop Name", "shopName"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("AddedBy", "addedBy"),
    ]

    return sendExcelFile(res, [column1], [data], ["Bills"])
  } catch (error) {
    return handleError(res, error)
  }
}

export const getBillsByShop = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    let { shopName, from, to } = req.query

    let data = await HardwareShopBill.find({
      shopName,
      companyAdminId,
      date: { $gte: from, $lte: to },
    })
      .select({
        date: 1,
        vehicleNo: 1,
        shopName: 1,
        addedBy: 1,
        amount: 1,
        remarks: 1,
      })
      .populate({ path: "addedBy", select: "location" })
      .sort({ date: -1 })

    if (!data) throw "Record Not Found"

    let totalAmount = 0
    data = parseResponse(data)
    data = data.map((val) => {
      totalAmount += val?.amount
      return {
        ...val,
        date: formatDateInDDMMYYY(val.date),
        addedBy: val?.addedBy?.location,
      }
    })

    return res.status(200).json({ data: { data, totalAmount } })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadBillsByShop = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    let { shopName, from, to } = req.query

    let data = await HardwareShopBill.find({
      companyAdminId,
      shopName,
      date: { $gte: from, $lte: to },
    })
      .select({
        _id: 0,
        date: 1,
        vehicleNo: 1,
        shopName: 1,
        addedBy: 1,
        amount: 1,
        remarks: 1,
      })
      .populate({ path: "addedBy", select: "location" })
      .sort({ date: 1 })

    if (!data) throw "Record Not Found"

    data = parseResponse(data)

    data = data.map((val) => {
      return {
        ...val,
        date: formatDateInDDMMYYY(val?.date),
        addedBy: val?.addedBy?.location,
      }
    })

    const column1 = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Shop Name", "shopName"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("AddedBy", "addedBy"),
    ]

    return sendExcelFile(res, [column1], [data], ["Bills"])
  } catch (error) {
    return handleError(res, error)
  }
}

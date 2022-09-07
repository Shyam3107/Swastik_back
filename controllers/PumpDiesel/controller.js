import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  userRankQuery,
  columnHeaders,
  formatDateInDDMMYYY,
  parseResponse,
  validateDateWhileUpload,
} from "../../utils/utils.js"
import Diesel from "../../models/Diesel.js"
import { INDIA_TZ } from "../../config/constants.js"
import { fileHeader, modelHeader, validateArr } from "./constants.js"
import { sendExcelFile } from "../../utils/sendFile.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getDiesels = async (req, res) => {
  try {
    const user = req.user
    let { dieselId, from, to } = req.query

    const userQuery = userRankQuery(user)
    let diesels
    if (dieselId)
      diesels = await Diesel.findOne({
        _id: dieselId,
        companyAdminId: user.companyAdminId,
      }).populate({
        path: "addedBy",
        select: "_id",
      })
    else {
      diesels = await Diesel.find({
        ...userQuery,
        date: { $gte: from, $lte: to },
      })
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ date: 1 })
      diesels = parseResponse(diesels)
      diesels = diesels.map((val) => {
        return {
          ...val,
          date: formatDateInDDMMYYY(val.date),
          addedBy: val?.addedBy?.location,
        }
      })
    }

    if (!diesels) throw "Record Not Found"

    return res.status(200).json({ data: diesels })
  } catch (error) {
    return handleError(res, error)
  }
}

export const getUniquePumpNames = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId

    let data = await Diesel.find({
      companyAdminId,
    })
      .select({ pumpName: 1, _id: 0 })
      .sort({ pumoName: 1 })
      .distinct("pumpName")

    if (!data) throw "Record Not Found"

    return res.status(200).json({ data })
  } catch (error) {
    return handleError(res, error)
  }
}

export const uploadDiesels = async (req, res) => {
  try {
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

        if (head !== "remarks" && head != "quantity" && !value)
          mssg = `Enter Valid ${fileHeader[index]} for row ${ind + 2}`

        if (mssg) throw mssg

        if (head === "date") {
          value = validateDateWhileUpload(value, ind)
        }

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await Diesel.insertMany(data)

    return res.status(200).json({
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const addDiesels = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      await Diesel.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res.status(200).json({ message: "Diesel Added Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const editDiesels = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      const dieselId = req.body._id
      const updateData = await Diesel.findByIdAndUpdate(
        { _id: dieselId },
        req.body
      )

      if (!updateData) throw "Record Not Found"

      return res
        .status(200)
        .json({ data: updateData, message: "Diesel Edited Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const deleteDiesels = async (req, res) => {
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }
    const dieselIds = req.body

    const deletedData = await Diesel.deleteMany({ _id: dieselIds })

    return res.status(200).json({
      data: deletedData,
      message: `Successfully Deleted ${dieselIds.length} Diesel${
        dieselIds.length > 1 ? "s" : ""
      }`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadDiesels = async (req, res) => {
  try {
    const userQuery = userRankQuery(req.user)
    const { from, to } = req.query
    let data = await Diesel.find({
      ...userQuery,
      date: { $gte: from, $lte: to },
    })
      .select({
        addedBy: 1,
        amount: 1,
        date: 1,
        fuel: 1,
        pumpName: 1,
        quantity: 1,
        remarks: 1,
        vehicleNo: 1,
      })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ date: 1 })

    if (!data) throw "Record Not Found"

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
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Fuel", "fuel"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ]
    return sendExcelFile(res, [column1], [data], ["Receipts"])
  } catch (error) {
    return handleError(res, error)
  }
}

export const getDieselsByVehicle = async (req, res) => {
  try {
    const user = req.user
    let { vehicleNo, from, to } = req.query

    const userQuery = userRankQuery(user)
    let diesels = await Diesel.find({
      ...userQuery,
      vehicleNo: vehicleNo?.toUpperCase(),
      date: { $gte: from, $lte: to },
    })
      .select({ companyAdminId: 0, createdAt: 0, updatedAt: 0, __v: 0 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ date: 1 })

    if (!diesels) throw "Record Not Found"

    diesels = parseResponse(diesels)
    let totalQuantity = 0
    let totalAmount = 0
    diesels = diesels.map((val) => {
      totalQuantity += val.quantity
      totalAmount += val.amount
      return {
        ...val,
        date: formatDateInDDMMYYY(val.date),
        addedBy: val?.addedBy?.location,
      }
    })

    return res
      .status(200)
      .json({ data: { totalAmount, totalQuantity, data: diesels } })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadDieselsByVehicle = async (req, res) => {
  try {
    const user = req.user
    let { vehicleNo, from, to } = req.query

    const userQuery = userRankQuery(user)
    let data = await Diesel.find({
      ...userQuery,
      vehicleNo: vehicleNo?.toUpperCase(),
      date: { $gte: from, $lte: to },
    })
      .select({ _id: 0, companyAdminId: 0, createdAt: 0, updatedAt: 0, __v: 0 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ date: 1 })

    if (!data) throw "Record Not Found"

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
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Fuel", "fuel"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ]
    return sendExcelFile(res, [column1], [data], ["Diesel"])
  } catch (error) {
    return handleError(res, error)
  }
}

export const getDieselsByPump = async (req, res) => {
  try {
    const user = req.user
    let { pumpName, from, to } = req.query

    const userQuery = userRankQuery(user)
    let diesels = await Diesel.find({
      ...userQuery,
      pumpName: pumpName?.toUpperCase(),
      date: { $gte: from, $lte: to },
    })
      .select({ companyAdminId: 0, createdAt: 0, updatedAt: 0, __v: 0 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ date: 1 })

    if (!diesels) throw "Record Not Found"
    diesels = parseResponse(diesels)

    let totalQuantity = 0
    let totalAmount = 0
    diesels = diesels.map((val) => {
      totalQuantity += val.quantity
      totalAmount += val.amount
      return {
        ...val,
        date: formatDateInDDMMYYY(val.date),
        addedBy: val?.addedBy?.location,
      }
    })

    if (!diesels) throw "Record Not Found"

    return res
      .status(200)
      .json({ data: { totalAmount, totalQuantity, data: diesels } })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadDieselsByPump = async (req, res) => {
  try {
    const user = req.user
    let { pumpName, from, to } = req.query

    const userQuery = userRankQuery(user)
    let data = await Diesel.find({
      ...userQuery,
      pumpName: pumpName?.toUpperCase(),
      date: { $gte: from, $lte: to },
    })
      .select({ id: 0, companyAdminId: 0, createdAt: 0, updatedAt: 0, __v: 0 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ date: 1 })

    if (!data) throw "Record Not Found"

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
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Amount", "amount"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Fuel", "fuel"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ]
    return sendExcelFile(res, [column1], [data], ["Receipts"])
  } catch (error) {
    return handleError(res, error)
  }
}

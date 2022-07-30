import moment from "moment"
import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  userRankQuery,
} from "../../utils/utils.js"
import Diesel from "../../models/Diesel.js"
import { INDIA_TZ } from "../../config/constants.js"
import { fileHeader, modelHeader, validateArr } from "./constants.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getDiesels = async (req, res) => {
  try {
    const user = req.user
    let {
      dieselId,
      from = moment().startOf("month"),
      to = moment(),
    } = req.query
    from = moment(from).startOf("day").toISOString()
    to = moment(to).endOf("day").toISOString()

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
    else
      diesels = await Diesel.find({
        ...userQuery,
        date: { $gte: from, $lte: to },
      })
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ vehicleNo: 1 })

    if (!diesels) throw "Record Not Found"

    return res.status(200).json({ data: diesels })
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

        if (head !== "remarks" && !value)
          mssg = `Enter Valid ${fileHeader[index]}`

        if (mssg) throw mssg

        if (head === "date") value = moment(value, "DD-MM-YYYY").toISOString()

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await Diesel.insertMany(data)

    return res.status(200).json({
      data: insertData,
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

      const insertData = await Diesel.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res
        .status(200)
        .json({ data: insertData, message: "Diesel Added Successfully" })
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
      message: `Diesel${dieselIds.length > 1 ? "s" : ""} Deleted Successfully`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

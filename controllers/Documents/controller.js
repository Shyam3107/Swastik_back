import moment from "moment"
import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  dateFormat,
} from "../../utils/utils.js"
import Document from "../../models/Document.js"
import Account from "../../models/Account.js"
import { fileHeader, modelHeader } from "./constants.js"
import { INDIA_TZ } from "../../config/constants.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getDocuments = async (req, res) => {
  try {
    const user = req.user
    const { vehicleNo } = req.query
    let documents
    if (vehicleNo)
      documents = await Document.findOne({
        companyAdminId: user.companyAdminId,
        vehicleNo: vehicleNo.toUpperCase(),
      }).populate({
        path: "addedBy",
        select: "_id",
      })
    else
      documents = await Document.find({ companyAdminId: user.companyAdminId })
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ vehicleNo: 1 })
    if (!documents) throw "This Vechile does not exist in our record"

    const companyAdminId = user.companyAdminId._id
    const documentsLink = await Account.findById({
      _id: companyAdminId,
    }).select({ documentsLink: 1 })
    if (!documentsLink) throw "Failed to get Documents, contact your Admin"

    return res
      .status(200)
      .json({ data: documents, documentsLink: documentsLink.documentsLink })
  } catch (error) {
    return handleError(res, error)
  }
}

export const uploadDocuments = async (req, res) => {
  try {
    const user = req.user

    let dataToBeInsert = req.body.data

    let data = []
    let tempVehicleNo = {}

    for (let ind = 0; ind < dataToBeInsert.length; ind++) {
      const item = dataToBeInsert[ind]
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId }
      let vehicleNo
      let mssg = ""

      for (let index = 0; index < modelHeader.length; index++) {
        const head = modelHeader[index]
        let value = item[fileHeader[index]]

        if (head === "vehicleNo") {
          if (!value) mssg = "All Fields should have Vehicle No."
          else if (tempVehicleNo[value])
            mssg = `Two rows can't have same Vehicle No. ${value}`
          else {
            const isExist = await Document.findOne({
              vehicleNo: value,
              companyAdminId: user.companyAdminId,
            })
            if (isExist) mssg = `Vehicle No. ${value} already exist`
            vehicleNo = value
            tempVehicleNo[value] = true
          }
        } else if (!value) mssg = `Enter Valid date for ${vehicleNo}`

        if (mssg) throw mssg

        if (index > 0)
          value = moment(value, dateFormat(value))
            .tz(INDIA_TZ)
            .endOf("day")
            .toISOString()

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await Document.insertMany(data)

    return res.status(200).json({
      data: insertData,
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const addDocuments = [
  validateBody(modelHeader.slice(0, modelHeader.length - 1)),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      const { vehicleNo } = req.body

      const isExist = await Document.findOne({
        vehicleNo,
        companyAdminId: user.companyAdminId,
      })
      if (isExist) throw `Vehicle No. ${vehicleNo} already exist`

      const insertData = await Document.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res
        .status(200)
        .json({ data: insertData, message: "Document Added Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const editDocuments = [
  validateBody(modelHeader.slice(0, modelHeader.length - 1)),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      const documentId = req.body._id
      const updateData = await Document.findByIdAndUpdate(
        { _id: documentId },
        req.body
      )

      if (!updateData) throw "Record Not Found"

      return res
        .status(200)
        .json({ data: updateData, message: "Document Edited Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const deleteDocuments = async (req, res) => {
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }
    const user = req.user
    const documentIds = req.body

    const deletedData = await Document.deleteMany({ _id: documentIds })

    return res.status(200).json({
      data: deletedData,
      message: `Document${
        documentIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

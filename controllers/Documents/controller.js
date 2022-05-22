import moment from "moment"
import {
  handleError,
  errorValidation,
  validateBody,
  dateFormat,
} from "../../utils/utils.js"
import Document from "../../models/Document.js"
import Account from "../../models/Account.js"

const fileHeader = [
  "Vehicle No.",
  "Tax Paid Upto",
  "Insurance Paid Upto",
  "Fitness Paid Upto",
  "Pollution Paid Upto",
  "Permit Paid Upto",
  "National Permit Paid Upto",
]

const modelHeader = [
  "vehicleNo",
  "taxPaidUpto",
  "insurancePaidUpto",
  "fitnessPaidUpto",
  "pollutionPaidUpto",
  "permitPaidUpto",
  "nationalPermitPaidUpto",
]

export async function getDocuments(req, res) {
  try {
    const user = req.user
    const { vehicleNo } = req.query
    let documents
    if (vehicleNo)
      documents = await Document.findOne({
        vehicleNo: vehicleNo.toUpperCase(),
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

export async function uploadDocuments(req, res) {
  try {
    const user = req.user

    let dataToBeInsert = req.body.data

    let data = []
    let tempVehicleNo = {}

    for (let i = 0; i < dataToBeInsert.length; i++) {
      const item = dataToBeInsert[i]
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId }
      let vehicleNo
      let mssg = ""

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index]
        let value = item[fileHeader[index]]

        if (head === "vehicleNo") {
          if (!value) mssg = "All Fields should have Vehicle No."
          else if (tempVehicleNo[value])
            mssg = `Two rows can't have same Vehicle No. ${value}`
          else {
            vehicleNo = value
            tempVehicleNo[value] = true
          }
        } else if (!value) mssg = `Enter Valid date for ${vehicleNo}`

        if (mssg) throw mssg

        if (index > 0) {
          value = moment(value, dateFormat(value)).endOf("day").toISOString()
        }

        tempVal[head] = value
      }

      const updateData = await Document.findOneAndUpdate(
        { vehicleNo: tempVal.vehicleNo },
        tempVal,
        { upsert: true, new: true }
      )

      if (!updateData) throw `Failed to Update Data from vehicleNo ${vehicleNo}`

      data.push(tempVal)
    }

    return res.status(200).json({
      data: data,
      entries: data.length,
      message: `Successfully Inserted ${data.length} entries`,
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

      const isExist = await Document.findOne({ vehicleNo })
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

export async function deleteDocuments(req, res) {
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

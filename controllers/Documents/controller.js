import moment from "moment"
import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  dateFormat,
  columnHeaders,
  formatDateInDDMMYYY,
  parseResponse,
} from "../../utils/utils.js"
import Document from "../../models/Document.js"
import Account from "../../models/Account.js"
import { fileHeader, modelHeader, validateArr } from "./constants.js"
import { INDIA_TZ } from "../../config/constants.js"
import { sendExcelFile } from "../../utils/sendFile.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getDocuments = async (req, res) => {
  try {
    const { vehicleNo } = req.query
    let documents
    if (vehicleNo) {
      documents = await Document.findOne({
        companyAdminId: req?.user?.companyAdminId,
        vehicleNo: vehicleNo.toUpperCase(),
      }).populate({
        path: "addedBy",
        select: "_id",
      })
    } else {
      documents = await Document.find({
        companyAdminId: req?.user?.companyAdminId,
      })
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ vehicleNo: 1 })
    }
    if (!documents) throw "This Vehicle does not exist in our record"

    const companyAdminId = req?.user?.companyAdminId._id
    const documentsLink = await Account.findById({
      _id: companyAdminId,
    }).select({ documentsLink: 1 })

    return res
      .status(200)
      .json({ data: documents, documentsLink: documentsLink.documentsLink })
  } catch (error) {
    return handleError(res, error)
  }
}

export const uploadDocuments = async (req, res) => {
  const session = await Document.startSession()
  try {
    session.startTransaction()
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
          if (!value) mssg = `Vehicle No. Missing for row ${ind + 2}`
          else if (tempVehicleNo[value])
            mssg = `Two rows can't have same Vehicle No. ${value}`
          vehicleNo = value
          tempVehicleNo[value] = true
        } else if (!value) mssg = `Enter Valid date for ${vehicleNo}`

        if (mssg) throw mssg

        if (index > 0)
          value = moment(value, dateFormat(value)).endOf("day").toISOString()

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await Document.insertMany(data, { session })

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

export const addDocuments = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      await Document.create({
        ...req.body,
        addedBy: req?.user?._id,
        companyAdminId: req?.user?.companyAdminId,
      })

      return res.status(200).json({ message: "Document Added Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const editDocuments = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

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
    const documentIds = req.body

    await Document.deleteMany({ _id: documentIds })

    return res.status(200).json({
      message: `Successfully Deleted ${documentIds.length} Document${
        documentIds.length > 1 ? "s" : ""
      }`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadDocuments = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    let data = await Document.find({
      companyAdminId,
    })
      .select({ _id: 0, __v: 0, companyAdminId: 0, createdAt: 0, updatedAt: 0 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ vehicleNo: 1 })

    data = parseResponse(data)

    data = data.map((val) => {
      return {
        ...val,
        taxPaidUpto: formatDateInDDMMYYY(val?.taxPaidUpto),
        insurancePaidUpto: formatDateInDDMMYYY(val?.insurancePaidUpto),
        fitnessPaidUpto: formatDateInDDMMYYY(val?.fitnessPaidUpto),
        pollutionPaidUpto: formatDateInDDMMYYY(val?.pollutionPaidUpto),
        permitPaidUpto: formatDateInDDMMYYY(val?.permitPaidUpto),
        nationalPermitPaidUpto: formatDateInDDMMYYY(
          val?.nationalPermitPaidUpto
        ),
        addedBy: val?.addedBy?.location,
      }
    })

    const column1 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Tax Paid Upto", "taxPaidUpto"),
      columnHeaders("Insurance Paid Upto", "insurancePaidUpto"),
      columnHeaders("Fitness Paid Upto", "fitnessPaidUpto"),
      columnHeaders("Pollution Paid Upto", "pollutionPaidUpto"),
      columnHeaders("Permit Paid Upto", "permitPaidUpto"),
      columnHeaders("National Permit Paid Upto", "nationalPermitPaidUpto"),
    ]

    return sendExcelFile(res, [column1], [data], ["Documents"])
  } catch (error) {
    return handleError(res, error)
  }
}

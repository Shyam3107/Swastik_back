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
import { fileHeader, modelHeader, validateArr } from "./constants.js"
import { INDIA_TZ } from "../../config/constants.js"
import { handleDuplication } from "../../utils/mongoErrors.js"

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

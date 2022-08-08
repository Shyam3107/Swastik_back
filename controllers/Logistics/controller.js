import moment from "moment"
import momentTimezone from "moment-timezone"
import mongoose from "mongoose"
import {
  handleError,
  errorValidation,
  validateBody,
  validatePhoneNo,
  columnHeaders,
} from "../../utils/utils.js"
import Product from "../../models/Product.js"
import Logistic from "../../models/Logistic.js"
import { INDIA_TZ } from "../../config/constants.js"
import { fileHeader, modelHeader, validateArr } from "./constants.js"
import { sendExcelFile } from "../../utils/sendFile.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getLogistics = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    let { logisticId, from, to } = req.query

    let data
    if (logisticId) {
      data = await Logistic.findById({ _id: logisticId, companyAdminId })
    } else {
      data = await Logistic.find({
        companyAdminId,
        date: { $gte: from, $lte: to },
      }).sort({ date: 1 })
    }

    if (!data) throw "Record Not Found"

    return res.status(200).json({ data })
  } catch (error) {
    return handleError(res, error)
  }
}

export const uploadLogistics = async (req, res) => {
  const session = await Logistic.startSession()
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

        if (head !== "remarks" && !value) {
          mssg = `Enter Valid ${fileHeader[index]} for row ${ind + 2}`
        } else if (head === "date")
          value = moment(value, dateFormat(value)).endOf("day").toISOString()

        if (mssg) throw mssg

        tempVal[head] = value
      }
      let qty = tempVal.quantity

      if (tempVal.status === "ISSUED") qty = -qty

      const updateData = await Product.findOneAndUpdate(
        {
          name: tempVal?.product?.toUpperCase(),
          companyAdminId: user.companyAdminId,
        },
        { $inc: { quantity: qty } },
        { session }
      )

      if (!updateData)
        throw `Enter Valid Product name for row ${ind + 2} : ${tempVal.product}`

      data.push(tempVal)
    }

    const insertData = await Logistic.insertMany(data, { session })

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

export const addLogistics = [
  validateBody(validateArr),
  async (req, res) => {
    const session = await mongoose.startSession()
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      session.startTransaction()
      if (!validatePhoneNo(req.body.personPhone))
        throw "Enter Correct Phone No."
      await Logistic.create(
        [
          {
            ...req.body,
            addedBy: req?.user?._id,
            companyAdminId: req?.user?.companyAdminId,
          },
        ],
        { session }
      )

      if (req.body.status === "ISSUED") req.body.quantity = -req.body.quantity

      await Product.findByIdAndUpdate(
        { _id: req.body.product },
        { $inc: { quantity: req.body.quantity } },
        { session }
      )

      await session.commitTransaction()
      return res.status(200).json({ message: "Logistic Added Successfully" })
    } catch (error) {
      await session.abortTransaction()
      return handleError(res, error)
    } finally {
      session.endSession()
    }
  },
]

export const editLogistics = [
  validateBody(validateArr),
  async (req, res) => {
    const session = await Product.startSession()
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      session.startTransaction()
      const logisticId = req.body._id
      const updateData = await Logistic.findByIdAndUpdate(
        { _id: logisticId },
        req.body,
        { session }
      )

      if (!updateData) throw "Record Not Found"

      let oldQty = updateData?.quantity
      // Remove received then it will be removed
      if (updateData.status === "RECEIVED") oldQty = -oldQty

      let newQty = req.body?.quantity
      // Remove received then it will be removed
      if (req.body?.status === "ISSUED") newQty = -newQty
      // If old Received, 10
      // If new Received, 15
      // diff is 5
      const diff = newQty + oldQty

      // Increment Diff in Product
      await Product.findByIdAndUpdate(
        { _id: req.body.product },
        { $inc: { quantity: diff } },
        { session }
      )

      await session.commitTransaction()

      return res.status(200).json({ message: "Logistic Edited Successfully" })
    } catch (error) {
      await session.abortTransaction()
      return handleError(res, error)
    } finally {
      await session.endSession()
    }
  },
]

export const deleteLogistics = async (req, res) => {
  const session = await mongoose.startSession()
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }
    session.startTransaction()
    const logisticIds = req.body

    // Delete all Logistics by that ID
    const deletedData = await Logistic.deleteMany(
      { _id: logisticIds },
      { session }
    )

    for (let index = 0; index < deletedData.length; index++) {
      let delData = deletedData[index]
      let rmvQty = delData.quantity

      if (delData.status === "RECEIVED") rmvQty = -rmvQty

      await Product.findByIdAndUpdate(
        { _id: delData.product },
        { $inc: { quantity: rmvQty } },
        { session }
      )
    }

    await session.commitTransaction()

    return res.status(200).json({
      message: `Successfully Deleted ${logisticIds.length} Logistic${
        logisticIds.length > 1 ? "s" : ""
      }`,
    })
  } catch (error) {
    await session.abortTransaction()
    return handleError(res, error)
  } finally {
    session.endSession()
  }
}

export const downloadLogistics = async (req, res) => {
  try {
    let { from, to } = req.query

    let data = await Logistic.find({
      companyAdminId,
      date: { $gte: from, $lte: to },
    })
      .select({
        date: 1,
        product: 1,
        quantity: 1,
        vehicleNo: 1,
        personName: 1,
        personPhone: 1,
        status: 1,
        remarks: 1,
      })
      .sort({ date: 1 })

    // TODO : Handle date in dd-mm-yyy format

    const column1 = [
      columnHeaders("Date", "date"),
      columnHeaders("Product", "product"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Status", "status"),
      columnHeaders("Person Name", "personName"),
      columnHeaders("Person Phone", "personPhone"),
      columnHeaders("Remarks", "remarks"),
    ]

    return sendExcelFile(res, [column1], [data], ["Logistics"])
  } catch (error) {
    return handleError(res, error)
  }
}

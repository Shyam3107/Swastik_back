import moment from "moment"
import momentTimezone from "moment-timezone"
import mongoose from "mongoose"
import {
  handleError,
  errorValidation,
  validateBody,
} from "../../utils/utils.js"
import Product from "../../models/Product.js"
import Logistic from "../../models/Logistic.js"
import { INDIA_TZ } from "../../config/constants.js"
import { fileHeader, modelHeader, validateArr } from "./constants.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getProducts = async (req, res) => {
  try {
    const user = req.user
    let {
      productId,
      from = moment().startOf("month"),
      to = moment(),
    } = req.query
    from = moment(from).startOf("day").toISOString()
    to = moment(to).endOf("day").toISOString()

    let data = {}
    if (productId) {
      data.products = await Product.findOne({
        _id: productId,
        companyAdminId: user.companyAdminId,
      }).select({ name: 1, quantity: 1, remarks: 1 })

      data.logistics = await Logistic.find({
        date: { $gte: from, $lte: to },
        product: productId,
      }).sort({ date: 1 })

      data.periodQuantity = await Logistic.aggregate([
        {
          $match: {
            date: { $gte: new Date(from) },
          },
        },
        {
          $group: {
            $id: null,
            total: {
              $cond: [
                { $eq: ["$status", "RECEIVED"] },
                { $sum: "$quantity" },
                { $subtract: "$quantity" },
              ],
            },
          },
        },
      ])
    } else {
      data = await Product.find({})
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ name: 1 })
    }

    if (!data) throw "Record Not Found"

    return res.status(200).json({ data })
  } catch (error) {
    return handleError(res, error)
  }
}

export const uploadProducts = async (req, res) => {
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

        if (head === "name" && !value) {
          mssg = `Enter Valid ${fileHeader[index]} for row ${ind + 2}`
        }

        if (head == "name") {
          const isExist = await Product.findOne({ name: value })
          if (isExist) mssg = `Product : ${head} already exist in our record`
        }
        if (mssg) throw mssg

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await Product.insertMany(data)

    return res.status(200).json({
      data: insertData,
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    })
  } catch (error) {
    if (error.code === 11000) {
      let errMssg = error?.message
      errMssg = errMssg.split("dup key:")[1]
      if (errMssg) error = "Duplicate Found : " + errMssg
    }
    return handleError(res, error)
  }
}

export const addProducts = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      const insertData = await Product.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res
        .status(200)
        .json({ data: insertData, message: "Product Added Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const editProducts = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      const productId = req.body._id
      const updateData = await Product.findByIdAndUpdate(
        { _id: productId },
        req.body
      )

      if (!updateData) throw "Record Not Found"

      return res
        .status(200)
        .json({ data: updateData, message: "Product Edited Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const deleteProducts = async (req, res) => {
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }
    const productIds = req.body

    const deletedData = await Product.deleteMany({ _id: productIds })

    const deleteLogistics = await Logistic.deleteMany({ product: productIds })

    return res.status(200).json({
      message: `Successfully Deleted ${productIds.length} Product${
        productIds.length > 1 ? "s" : ""
      }`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadProducts = async (req, res) => {
  try {
    let products = await Product.find({
      companyAdminId: req.user.companyAdminId,
    })
      .sort({ name: 1 })
      .select({
        _id: 0,
        name: 1,
        quantity: 1,
        remarks: 1,
      })

    const column1 = [
      columnHeaders("Name", "name"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Remarks", "remarks"),
    ]

    return sendExcelFile(res, [column1], [products], ["Products"])
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadProductsById = async (req, res) => {
  try {
    let {
      productId,
      from = moment().startOf("month"),
      to = moment(),
    } = req.query
    from = moment(from).startOf("day").toISOString()
    to = moment(to).endOf("day").toISOString()

    let products = await Product.findById({ _id: productId }).select({
      _id: 0,
      name: 1,
      quantity: 1,
      remarks: 1,
    })

    let logistics = await Logistic.find({
      date: { $gte: from, $lte: to },
      product: productId,
    })
      .sort({ date: 1 })
      .select({
        _id: 0,
        date: 1,
        quantity: 1,
        personName: 1,
        personPhone: 1,
        status: 1,
        remarks: 1,
      })

    const column2 = [
      columnHeaders("Date", "date"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Person Name", "personName"),
      columnHeaders("Person Phone", "personPhone"),
      columnHeaders("Status", "status"),
      columnHeaders("Remarks", "remarks"),
    ]

    return sendExcelFile(res, [column2], [logistics], ["Logistic"])
  } catch (error) {
    return handleError(res, error)
  }
}

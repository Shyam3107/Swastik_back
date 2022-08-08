import momentTimezone from "moment-timezone"
import mongoose from "mongoose"
import {
  handleError,
  errorValidation,
  validateBody,
  columnHeaders,
} from "../../utils/utils.js"
import Product from "../../models/Product.js"
import Logistic from "../../models/Logistic.js"
import { INDIA_TZ } from "../../config/constants.js"
import { fileHeader, modelHeader, validateArr } from "./constants.js"
import { sendExcelFile } from "../../utils/sendFile.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getProducts = async (req, res) => {
  try {
    const user = req.user
    const companyAdminId = user.companyAdminId
    let { productId, from, to } = req.query

    let data = {}
    if (productId) {
      data.products = await Product.findOne({
        _id: productId,
        companyAdminId,
      }).select({ name: 1, quantity: 1, remarks: 1 })

      // Find all Logistic of that Product
      data.logistics = await Logistic.find({
        date: { $gte: from, $lte: to },
        product: productId,
        companyAdminId,
      })
        .select({
          date: 1,
          quantity: 1,
          vehicleNo: 1,
          personName: 1,
          personPhone: 1,
          status: 1,
          addedBy: 1,
        })
        .populate({ path: "addedBy", select: "location" })
        .sort({ date: 1 })

      const tempQty = await Logistic.aggregate([
        {
          $match: {
            date: { $gte: new Date(from) },
            companyAdminId: mongoose.Types.ObjectId(companyAdminId?._id),
          },
        },
        {
          $group: {
            _id: {},
            received: {
              $sum: {
                $cond: [{ $eq: ["$status", "RECEIVED"] }, "$quantity", 0],
              },
            },
            issued: {
              $sum: {
                $cond: [{ $eq: ["$status", "ISSUED"] }, "$quantity", 0],
              },
            },
          },
        },
      ])
      data.periodQuantity = tempQty[0].received - tempQty[0].issued
    } else {
      // Find all Product of Company
      data = await Product.find({ companyAdminId })
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

export const getProductsName = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    const data = await Product.find({ companyAdminId })
      .select({ name: 1 })
      .sort({ name: 1 })
    if (!data) throw "Record Not Found"

    return res.status(200).json({ data })
  } catch (error) {
    return handleError(res, error)
  }
}

export const uploadProducts = async (req, res) => {
  const session = await Product.startSession()
  try {
    session.startTransaction()
    const user = req.user
    const companyAdminId = user.companyAdminId

    let dataToBeInsert = req.body.data

    let data = []

    for (let ind = 0; ind < dataToBeInsert.length; ind++) {
      const item = dataToBeInsert[ind]
      let tempVal = { addedBy: user._id, companyAdminId }

      let mssg = ""

      for (let index = 0; index < modelHeader.length; index++) {
        const head = modelHeader[index]
        let value = item[fileHeader[index]]

        if (head === "name" && !value) {
          mssg = `Enter Valid ${fileHeader[index]} for row ${ind + 2}`
        }

        if (mssg) throw mssg

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    const insertData = await Product.insertMany(data, { session })

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

export const addProducts = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      await Product.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res.status(200).json({ message: "Product Added Successfully" })
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

      return res.status(200).json({ message: "Product Edited Successfully" })
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

    // Delete all Products by that ID
    await Product.deleteMany({ _id: productIds })

    // Delete all Logistic associated with that Product
    await Logistic.deleteMany({ product: productIds })

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
    const companyAdminId = req?.user?.companyAdminId
    let { productId, from, to } = req.query

    let product = await Product.findById({
      _id: productId,
      companyAdminId,
    }).select({
      _id: 0,
      name: 1,
      quantity: 1,
      remarks: 1,
    })

    let logistics = await Logistic.find({
      date: { $gte: from, $lte: to },
      product: productId,
      companyAdminId,
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

    // Get The total Quantity we have just Before from date
    const tempQty = await Logistic.aggregate([
      {
        $match: {
          date: { $gte: new Date(from) },
          companyAdminId: mongoose.Types.ObjectId(companyAdminId?._id),
        },
      },
      {
        $group: {
          _id: {},
          received: {
            $sum: {
              $cond: [{ $eq: ["$status", "RECEIVED"] }, "$quantity", 0],
            },
          },
          issued: {
            $sum: {
              $cond: [{ $eq: ["$status", "ISSUED"] }, "$quantity", 0],
            },
          },
        },
      },
    ])
    const periodQuantity = tempQty[0].received - tempQty[0].issued

    const column1 = [
      columnHeaders("Product Name", "name"),
      columnHeaders("Quantity on Asked Date", "askQty"),
      columnHeaders("Current Quantity", "quantity"),
      columnHeaders("Remarks", "remarks"),
    ]

    const row1 = [{ ...product, askQty: product?.quantity - periodQuantity }]

    // TODO : Date should be in DD-MM-YYYY format

    const column2 = [
      columnHeaders("Date", "date"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Status", "status"),
      columnHeaders("Person Name", "personName"),
      columnHeaders("Person Phone", "personPhone"),
      columnHeaders("Remarks", "remarks"),
    ]

    return sendExcelFile(
      res,
      [column1, column2],
      [row1, logistics],
      ["Product", "Logistic"]
    )
  } catch (error) {
    return handleError(res, error)
  }
}

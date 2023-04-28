import {
  handleError,
  errorValidation,
  validateBody,
  parseResponse,
  columnHeaders,
} from "../../utils/utils.js"
import { sendExcelFile } from "../../utils/sendFile.js"
import VehicleOwner from "../../models/VehicleOwner.js"
import { modelHeader, fileHeader, validateArr } from "./constants.js"

export const getOwner = async (req, res) => {
  try {
    const user = req.user
    let { vehicleNo } = req.query

    let details
    if (vehicleNo) {
      details = await VehicleOwner.findOne({
        vehicleNo,
        companyAdminId: user.companyAdminId,
      }).select({ vehicleNo: 1, owner: 1, remarks: 1 })
    } else {
      details = await VehicleOwner.find({
        companyAdminId: user.companyAdminId,
      })
        .select({ vehicleNo: 1, remarks: 1, addedBy: 1, owner: 1 })
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ vehicleNo: 1 })
      details = parseResponse(details)
      details = details.map((val) => {
        return {
          ...val,
          addedBy: val?.addedBy?.location,
        }
      })
    }

    if (!details) throw "Record Not Found"

    return res.status(200).json({ data: details })
  } catch (error) {
    return handleError(res, error)
  }
}

export const uploadOwner = async (req, res) => {
  const session = await VehicleOwner.startSession()
  try {
    session.startTransaction()
    const user = req.user

    let dataToBeInsert = req.body.data

    let data = []
    let tempVehicleNo = {}

    for (let i = 0; i < dataToBeInsert.length; i++) {
      const item = dataToBeInsert[i]
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId }
      let mssg = ""

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index]
        let value = item[fileHeader[index]]

        // Vehicle No and owner is Mandatory
        if (index < 2 && !value)
          mssg = `Enter Valid ${fileHeader[index]} in row: ${i + 2}`

        // Check for duplicate records inside Datatobeinsert
        if (head === "vehicleNo") {
          if (tempVehicleNo[value])
            mssg = `Two Records can't have same Vehicle No: ${value}`
          tempVehicleNo[value] = true
        }
        if (mssg) throw mssg

        tempVal[head] = value
      }

      data.push(tempVal)
    }

    console.log("Data : ", data)
    const insertData = await VehicleOwner.insertMany(data, { session })
    await session.commitTransaction()

    return res.status(200).json({
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    })
  } catch (error) {
    await session.abortTransaction()
    return handleError(res, error)
  } finally {
    await session.endSession()
  }
}

export const addOwner = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const user = req.user

      await VehicleOwner.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      })

      return res.status(200).json({
        message: "Vehicle Added Successfully",
      })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const editOwner = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      const vehicleId = req.body._id
      const updateData = await VehicleOwner.findByIdAndUpdate(
        { _id: vehicleId },
        req.body
      )

      if (!updateData) throw "Record Not Found"

      return res.status(200).json({
        message: "Vehicle Edited Successfully",
      })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const deleteOwner = async (req, res) => {
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }
    const vehicleIds = req.body

    await VehicleOwner.deleteMany({ _id: vehicleIds })

    return res.status(200).json({
      message: `Successfully Deleted ${vehicleIds.length} Vehicle${
        vehicleIds.length > 1 ? "s" : ""
      }`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadOwner = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    let data = await VehicleOwner.find({
      companyAdminId,
    })
      .select({ _id: 0, vehicleNo: 1, owner: 1, addedBy: 1, remarks: 1 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ vehicleNo: 1 })

    data = parseResponse(data)

    data = data.map((val) => {
      return {
        ...val,
        addedBy: val?.addedBy?.location,
      }
    })

    const column1 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Owner", "owner"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ]
    return sendExcelFile(res, [column1], [data], ["Owners"])
  } catch (error) {
    return handleError(res, error)
  }
}

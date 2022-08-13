import moment from "moment"
import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  validatePhoneNo,
  columnHeaders,
  parseResponse,
  formatDateInDDMMYYY,
} from "../../utils/utils.js"
import Trip from "../../models/Trip.js"
import { fileHeader, modelHeader, validateArr } from "./constants.js"
import { INDIA_TZ } from "../../config/constants.js"
import { sendExcelFile } from "../../utils/sendFile.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getTrips = async (req, res) => {
  try {
    const user = req.user
    let { diNo, from, to } = req.query

    let trips
    let metaData = {}
    let query = {
      companyAdminId: user.companyAdminId,
      date: { $gte: from, $lte: to },
    }

    if (user?.showTrips === "SELF") {
      query.addedBy = user._id
    }

    let select = { __v: 0, createdAt: 0, updatedAt: 0, companyAdminId: 0 }
    if (diNo)
      trips = await Trip.findOne({
        diNo,
        companyAdminId: user.companyAdminId,
      }).populate({
        path: "addedBy",
        select: "location consignor branch",
      })
    else {
      trips = await Trip.find(query)
        .select(select)
        .populate({ path: "addedBy", select: "location" })
        .sort({ date: -1 })
      trips = parseResponse(trips)
      trips = trips.map((val) => {
        return {
          ...val,
          date: formatDateInDDMMYYY(val?.date),
          addedBy: val?.addedBy?.location,
        }
      })
      metaData.totalDocuments = trips.length
    }
    if (!trips) throw "This DI No. does not exist in our record"

    return res.status(200).json({ metaData, data: trips })
  } catch (error) {
    return handleError(res, error)
  }
}

export const uploadTrips = async (req, res) => {
  const session = await Trip.startSession()
  try {
    session.startTransaction()

    const dataToBeInsert = req.body.data

    let data = []
    let tempDiNo = {}

    for (let i = 0; i < dataToBeInsert.length; i++) {
      const item = dataToBeInsert[i]
      let tempVal = {
        addedBy: req.user._id,
        companyAdminId: req.user.companyAdminId,
      }
      let diNo
      let mssg = ""

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index]
        let value = item[fileHeader[index]]

        if (head === "diNo") {
          if (!value) mssg = "All Fields Should have DI No."
          else if (tempDiNo[value])
            mssg = `Two rows can't have same DI No. ${value}`

          diNo = value
          tempDiNo[value] = true
        } else if (index < 10 && !value)
          mssg = `${fileHeader[index]} is required for DI No. ${diNo}`
        else if (head === "driverPhone" && !validatePhoneNo(value))
          mssg = `Fill Valid Driver Phone No. for DI No. ${diNo}`
        else if (
          item["Diesel"] &&
          head === "dieselIn" &&
          value !== "Litre" &&
          value !== "Amount"
        )
          mssg = `Diesel In should be Litre or Amount for DI No. ${diNo}`
        else if (item["Diesel"] && !item["Pump Name"])
          mssg = `Pump Name is mandatory if Diesel Taken for DI No. ${diNo}`

        if (mssg) throw mssg

        if (head === "date") value = moment(value, "DD-MM-YYYY").toISOString()

        tempVal[head] = value
      }

      if (!tempVal.pumpName) delete tempVal.pumpName
      if (!tempVal.diesel) delete tempVal.diesel
      if (!tempVal.dieselIn) delete tempVal.dieselIn
      if (!tempVal.cash) delete tempVal.cash
      if (!tempVal.remarks) delete tempVal.remarks

      data.push(tempVal)
    }

    const insertData = await Trip.insertMany(data, { session })
    await session.commitTransaction()

    return res.status(200).json({
      data: insertData,
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    })
  } catch (error) {
    await session.abortTransaction()
    return handleError(res, error)
  } finally {
    session.endSession()
  }
}

export const addTrips = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }
      const { dieselIn, cash, remarks, diesel, pumpName } = req.body

      if (!validatePhoneNo(req.body.driverPhone)) throw "Enter Valid Phone No."

      if (diesel && dieselIn !== "Litre" && dieselIn !== "Amount")
        throw "Diesel In Field should be Litre or Amount"

      if (diesel && !pumpName) throw "Pump Name is required if Diesel Taken"

      if (cash && !remarks) throw "Remarks field is mandatory if given Cash"

      if (!req.body.pumpName) delete req.body.pumpName
      if (!req.body.diesel) delete req.body.diesel
      if (!req.body.dieselIn) delete req.body.dieselIn
      if (!req.body.cash) delete req.body.cash
      if (!req.body.remarks) delete req.body.remarks

      await Trip.create({
        ...req.body,
        addedBy: req?.user?._id,
        companyAdminId: req?.user?.companyAdminId,
      })

      return res.status(200).json({ message: "Trip Added Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const editTrips = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res)
      if (errors) {
        return null
      }

      const {
        dieselIn,
        cash,
        remarks,
        diesel,
        pumpName,
        _id: tripId,
      } = req.body

      if (!validatePhoneNo(req.body.driverPhone)) throw "Enter Valid Phone No."

      if (diesel && dieselIn !== "Litre" && dieselIn !== "Amount")
        throw "Diesel In Field should be Litre or Amount"

      if (diesel && !pumpName) throw "Pump Name is required if Diesel Taken"

      if (cash && !remarks) throw "Remarks field is mandatory if given Cash"

      if (!req.body.pumpName) delete req.body.pumpName
      if (!req.body.diesel) delete req.body.diesel
      if (!req.body.dieselIn) delete req.body.dieselIn
      if (!req.body.cash) delete req.body.cash
      if (!req.body.remarks) delete req.body.remarks

      const updateData = await Trip.findByIdAndUpdate({ _id: tripId }, req.body)

      if (!updateData) throw "Record Not Found"

      return res.status(200).json({ message: "Trip Edited Successfully" })
    } catch (error) {
      return handleError(res, error)
    }
  },
]

export const deleteTrips = async (req, res) => {
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }
    const tripIds = req.body

    await Trip.deleteMany({ _id: tripIds })

    return res.status(200).json({
      message: `Successfully Deleted ${tripIds.length} Trip${
        tripIds.length > 1 ? "s" : ""
      }`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

export const downloadTrips = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId
    const { from, to } = req.query
    let trips = await Trip.find({
      companyAdminId,
      date: { $gte: from, $lte: to },
    })
      .select({
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
        companyAdminId: 0,
      })
      .populate({ path: "addedBy", select: "location" })
      .sort({ date: 1 })

    trips = parseResponse(trips)

    trips = trips.map((val) => {
      return {
        ...val,
        date: formatDateInDDMMYYY(val.date),
        addedBy: val?.addedBy?.location ?? "",
      }
    })

    const column1 = [
      columnHeaders("DI No.", "diNo"),
      columnHeaders("LR No.", "lrNo"),
      columnHeaders("Date", "date"),
      columnHeaders("Loading Point", "loadingPoint"),
      columnHeaders("Party Name", "partyName"),
      columnHeaders("Location", "location"),
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Quantity", "quantity"),
      columnHeaders("Material", "material"),
      columnHeaders("Driver Name", "driverName"),
      columnHeaders("Driver Phone", "driverPhone"),
      columnHeaders("Diesel", "diesel"),
      columnHeaders("Diesel In", "dieselIn"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Cash", "cash"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ]

    return sendExcelFile(res, [column1], [trips], ["Trips"])
  } catch (error) {
    return handleError(res, error)
  }
}

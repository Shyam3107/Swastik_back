import momentTimezone from "moment-timezone"
import {
  handleError,
  errorValidation,
  validateBody,
  validatePhoneNo,
  columnHeaders,
  parseResponse,
  formatDateInDDMMYYY,
  validateDateWhileUpload,
} from "../../utils/utils.js"
import Trip from "../../models/Trip.js"
import { fileHeader, modelHeader, unImportantFields, validateArr } from "./constants.js"
import { INDIA_TZ } from "../../config/constants.js"
import { sendExcelFile } from "../../utils/sendFile.js"

momentTimezone.tz.setDefault(INDIA_TZ)

// Get the list of Trips or a trip
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

    // If DI No given then fetch that specific record
    if (diNo)
      trips = await Trip.findOne({
        diNo,
        companyAdminId: user.companyAdminId,
      }).populate({
        path: "addedBy",
        select: "location consignor branch",
      })
    else {
      // Find all Trips
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

// Upload the List of Trips
export const uploadTrips = async (req, res) => {
  const session = await Trip.startSession()
  try {
    session.startTransaction()

    const dataToBeInsert = req.body.data

    let data = []
    // To keep the record of DI NO. present in the list
    let tempDiNo = {}

    console.log("Date to be Insert: ", dataToBeInsert)

    for (let ind = 0; ind < dataToBeInsert.length; ind++) {
      const item = dataToBeInsert[ind]
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
          if (!value) mssg = `All Fields Should have DI No. ,row no. ${ind + 2}`
          else if (tempDiNo[value]) // For same DI No.
            mssg = `Two rows can't have same DI No. ${value}`

          diNo = value
          tempDiNo[value] = true
        } else if (!unImportantFields.includes(head) && !value) {
          // If value is empty for required fields
          mssg = `${fileHeader[index]} is required for DI No. ${diNo}`
        } else if (head === "driverPhone" && !validatePhoneNo(value))
          mssg = `Fill Valid Driver Phone No. for DI No. ${diNo}`
        else if ( // If Diesel has value but unit ie Litre or Amount is not defined
          item["Diesel"] &&
          head === "dieselIn" &&
          value !== "Litre" &&
          value !== "Amount"
        )
          mssg = `Diesel In should be Litre or Amount for DI No. ${diNo}`
        else if (item["Diesel"] && !item["Pump Name"]) // Diesel Taken but Pump name not defined
          mssg = `Pump Name is mandatory if Diesel Taken for DI No. ${diNo}`

        if (mssg) throw mssg

        if (head === "date") {
          value = validateDateWhileUpload(value, ind)
        }

        tempVal[head] = value
      }

      // Removed unnecessary fields only if it doesn't have any value
      if (!tempVal.pumpName) delete tempVal.pumpName
      if (!tempVal.diesel) delete tempVal.diesel
      if (!tempVal.dieselIn) delete tempVal.dieselIn
      if (!tempVal.cash) delete tempVal.cash
      if (!tempVal.remarks) delete tempVal.remarks

      data.push(tempVal)
    }

    console.log("Data : ", data)
    const insertData = await Trip.insertMany(data, { session })
    await session.commitTransaction()

    return res.status(200).json({
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

// Upload the Rate of Trips
export const uploadRates = async (req, res) => {
  const session = await Trip.startSession()
  try {
    session.startTransaction()

    const dataToBeUpdate = req.query.data ?? []

    console.log("Date to be Update: ", dataToBeUpdate)

    // For Excel, DI whose rate hasn't been updated
    const column1 = [
      columnHeaders("DI No.", "DI No."),
      columnHeaders("Date", "Date"),
      columnHeaders("Vehicle No.", "Vehicle No."),
      columnHeaders("Billing Rate", "Billing Rate"),
      columnHeaders("Rate", "Rate"),
      columnHeaders("Reason", "reason")
    ]

    let row = []

    for (let ind = 0; ind < dataToBeUpdate.length; ind++) {
      const item = JSON.parse(dataToBeUpdate[ind])

      let diNo = item["DI No."]
      let vehicleNo = item["Vehicle No."]
      let rate = item["Rate"]
      let billingRate = item["Billing Rate"]

      let tempObj = { ...item, reason: "" }
      if (billingRate === null || billingRate === undefined)
        throw `Billing Rate is required for row no. ${ind + 2}`
      if (rate === null || rate === undefined)
        throw `Rate is required for row no. ${ind + 2}`

      const updateRate = await Trip.findOneAndUpdate({ diNo, vehicleNo }, { $set: { billingRate, rate } }, { session })

      // If not updated, means DI no. with vehicle doesn't exist
      if (!updateRate) {
        tempObj.reason = "Record doesn't exist"
        row.push(tempObj)
      }
    }

    console.log("No. of Total Entry : " + dataToBeUpdate.length)
    console.log("No. of Success Entry : " + (dataToBeUpdate.length - row.length))
    console.log("No. of Failed Entry : " + row.length)

    console.log("Row : ", row)
    await session.commitTransaction()

    return sendExcelFile(res, [column1], [row], ["Entries"])
  } catch (error) {
    await session.abortTransaction()
    return handleError(res, error)
  } finally {
    session.endSession()
  }
}

// Add a trip
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

// Edit a trip
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

// Delete the Trips as per given List of IDs
export const deleteTrips = async (req, res) => {
  try {
    const errors = errorValidation(req, res)
    if (errors) {
      return null
    }
    const tripIds = req.body

    await Trip.deleteMany({ _id: tripIds })

    return res.status(200).json({
      message: `Successfully Deleted ${tripIds.length} Trip${tripIds.length > 1 ? "s" : ""
        }`,
    })
  } catch (error) {
    return handleError(res, error)
  }
}

// Download The list of trips
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

    if (!trips) throw "Record Not Found"

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
      columnHeaders("Shortage", "shortage"),
      columnHeaders("Shortage Amount", "shortageAmount"),
      columnHeaders("Driver Name", "driverName"),
      columnHeaders("Driver Phone", "driverPhone"),
      columnHeaders("Diesel", "diesel"),
      columnHeaders("Diesel In", "dieselIn"),
      columnHeaders("Pump Name", "pumpName"),
      columnHeaders("Billing Rate", "billingRate"),
      columnHeaders("Rate", "rate"),
      columnHeaders("Cash", "cash"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ]

    return sendExcelFile(res, [column1], [trips], ["Trips"])
  } catch (error) {
    return handleError(res, error)
  }
}

// Get all Trips of Specific Vehicle
export const getTripsByVehicle = async (req, res) => {
  try {
    const companyAdminId = req.user.companyAdminId
    let { vehicleNo, from, to } = req.query

    let trips = await Trip.find({
      companyAdminId,
      vehicleNo: vehicleNo?.toUpperCase(),
      date: { $gte: from, $lte: to },
    })
      .select({ companyAdminId: 0, createdAt: 0, updatedAt: 0, __v: 0 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ date: 1 })

    if (!trips) throw "Record Not Found"

    trips = parseResponse(trips)
    let totalQuantity = 0
    trips = trips.map((val) => {
      totalQuantity += val.quantity
      return {
        ...val,
        date: formatDateInDDMMYYY(val.date),
        addedBy: val?.addedBy?.location,
      }
    })

    return res.status(200).json({ data: { totalQuantity, data: trips } })
  } catch (error) {
    return handleError(res, error)
  }
}

// Download the list of trips of specific vehicle
export const downloadTripsByVehicle = async (req, res) => {
  try {
    const companyAdminId = req.user.companyAdminId
    let { vehicleNo, from, to } = req.query

    let data = await Trip.find({
      companyAdminId,
      vehicleNo: vehicleNo?.toUpperCase(),
      date: { $gte: from, $lte: to },
    })
      .select({ companyAdminId: 0, createdAt: 0, updatedAt: 0, __v: 0 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ date: 1 })

    if (!data) throw "Record Not Found"

    data = parseResponse(data)

    data = data.map((val) => {
      return {
        ...val,
        date: formatDateInDDMMYYY(val.date),
        addedBy: val?.addedBy?.location,
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
      columnHeaders("Billing Rate", "billingRate"),
      columnHeaders("Rate", "rate"),
      columnHeaders("Cash", "cash"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Added By", "addedBy"),
    ]

    return sendExcelFile(res, [column1], [data], ["Trips"])
  } catch (error) {
    return handleError(res, error)
  }
}

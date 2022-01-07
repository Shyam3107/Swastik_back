const moment = require("moment");
const {
  handleError,
  errorValidation,
  validateBody,
  validatePhoneNo,
} = require("../../utils/utils");
const Trip = require("../../models/Trip");

const fileHeader = [
  "DI No.",
  "LR No.",
  "Date",
  "Loading Point",
  "Party Name",
  "Location",
  "Vehicle No.",
  "Quantity",
  "Driver Name",
  "Driver Phone",
  "Diesel",
  "Diesel In",
  "Pump Name",
  "Cash",
  "Remarks",
];

const modelHeader = [
  "diNo",
  "lrNo",
  "date",
  "loadingPoint",
  "partyName",
  "location",
  "vehicleNo",
  "quantity",
  "driverName",
  "driverPhone",
  "diesel",
  "dieselIn",
  "pumpName",
  "cash",
  "remarks",
];

module.exports.getTrips = async (req, res) => {
  try {
    const user = req.user;
    const { diNo } = req.query;
    let trips;
    if (diNo)
      trips = await Trip.findOne({ diNo }).populate({
        path: "addedBy",
        select: "location",
      });
    else
      trips = await Trip.find({ companyAdminId: user.companyAdminId })
        .populate({ path: "addedBy", select: "location" })
        .sort({ date: -1 });

    if (!trips) throw "This DI No. does not exist in our record";

    return res.status(200).json({ data: trips });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports.uploadTrips = async (req, res) => {
  try {
    const user = req.user;

    const dataToBeInsert = req.body.data;

    let data = [];
    let tempDiNo = {};

    for await (item of dataToBeInsert) {
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId };
      let diNo;
      let mssg = "";

      for await ([index, head] of modelHeader.entries()) {
        let value = item[fileHeader[index]];

        if (head === "diNo") {
          if (!value) mssg = "All Fields Should have DI No.";
          else if (tempDiNo[value])
            mssg = `Two rows can't have same DI No. ${value}`;
          else {
            const isExist = await Trip.findOne({
              diNo: value,
              companyAdminId: user.companyAdminId,
            });
            if (isExist) mssg = `DI No. ${value} already exist`;
            diNo = value;
            tempDiNo[value] = true;
          }
        } else if (index < 9 && !value)
          mssg = `${fileHeader[index]} is required for DI No. ${diNo}`;
        else if (head === "driverPhone" && !validatePhoneNo(value))
          mssg = `Fill Valid Driver Phone No. for DI No. ${diNo}`;
        else if (
          item["Diesel"] &&
          head === "dieselIn" &&
          value !== "Litre" &&
          value !== "Amount"
        )
          mssg = `Diesel In should be Litre or Amount for DI No. ${diNo}`;
        else if (item["Diesel"] && !item["Pump Name"])
          mssg = `Pump Name is mandatory if Diesel Taken for DI No. ${diNo}`;

        if (mssg) throw mssg;

        if (head === "date") value = moment(value, "DD-MM-YYYY").toISOString();

        tempVal[head] = value;
      }

      if (!tempVal.pumpName) delete tempVal.pumpName;
      if (!tempVal.diesel) delete tempVal.diesel;
      if (!tempVal.dieselIn) delete tempVal.dieselIn;
      if (!tempVal.cash) delete tempVal.cash;
      if (!tempVal.remarks) delete tempVal.remarks;

      data.push(tempVal);
    }

    const insertData = await Trip.insertMany(data);

    return res.status(200).json({
      data: insertData,
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports.addTrips = [
  validateBody([
    "diNo",
    "lrNo",
    "date",
    "loadingPoint",
    "partyName",
    "location",
    "vehicleNo",
    "quantity",
    "driverName",
    "driverPhone",
  ]),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;
      const { driverPhone, dieselIn, cash, remarks, diNo } = req.body;

      if (!validatePhoneNo(driverPhone)) throw "Enter Valid Phone No.";

      if (dieselIn && dieselIn !== "Litre" && dieselIn !== "Amount")
        throw "Diesel In Field should be Litre or Amount";

      if (cash && !remarks) throw "Remarks field is mandatory if given Cash";

      const isExist = await Trip.findOne({
        diNo,
        companyAdminId: user.companyAdminId,
      });
      if (isExist) throw `DI No. ${diNo} already exist`;

      if (!req.body.pumpName) delete req.body.pumpName;
      if (!req.body.diesel) delete req.body.diesel;
      if (!req.body.dieselIn) delete req.body.dieselIn;
      if (!req.body.cash) delete req.body.cash;
      if (!req.body.remarks) delete req.body.remarks;

      const insertData = await Trip.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      });

      return res
        .status(200)
        .json({ data: insertData, message: "Trip Added Successfully" });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

module.exports.editTrips = [
  validateBody([
    "diNo",
    "lrNo",
    "date",
    "loadingPoint",
    "partyName",
    "location",
    "vehicleNo",
    "quantity",
    "driverName",
    "driverPhone",
  ]),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      const tripId = req.body._id;
      if (!req.body.pumpName) delete req.body.pumpName;
      if (!req.body.diesel) delete req.body.diesel;
      if (!req.body.dieselIn) delete req.body.dieselIn;
      if (!req.body.cash) delete req.body.cash;
      if (!req.body.remarks) delete req.body.remarks;
      const updateData = await Trip.findByIdAndUpdate(
        { _id: tripId },
        req.body
      );

      if (!updateData) throw "Record Not Found";

      return res
        .status(200)
        .json({ data: updateData, message: "Trip Edited Successfully" });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

module.exports.deleteTrips = async (req, res) => {
  try {
    const errors = errorValidation(req, res);
    if (errors) {
      return null;
    }
    const user = req.user;
    const tripIds = req.body;

    const deletedData = await Trip.deleteMany({ _id: tripIds });

    return res.status(200).json({
      data: deletedData,
      message: `Trip${tripIds.length > 1 ? "s" : ""} Deleted Successfully`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

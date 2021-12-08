const moment = require("moment");
const { convertCSVToJSON } = require("../../utils/utils");
const {
  handleError,
  errorValidation,
  validateBody,
  validatePhoneNo,
  removeFile,
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
    const trips = await Trip.find();
    return res.status(200).json({ data: trips });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports.uploadTrips = async (req, res) => {
  try {
    const user = req.user;

    const dataToBeInsert = await convertCSVToJSON(req.file.path);

    let data = [];
    let tempDiNo = {};

    for await (item of dataToBeInsert) {
      let tempVal = { plant: user.plant };
      let diNo;
      let mssg = "";

      for await ([index, head] of modelHeader.entries()) {
        let value = item[fileHeader[index]];

        if (head === "diNo") {
          if (!value) mssg = "All Fields Should have DI No.";
          else if (tempDiNo[value])
            mssg = `Two rows can't have same DI No. ${value}`;
          else {
            const isExist = await Trip.findOne({ diNo: value });
            if (isExist) mssg = `DI No. ${value} already exist`;
            diNo = value;
            tempDiNo[value] = true;
          }
        } else if (
          head === "dieselIn" &&
          value !== "Litre" &&
          value !== "Amount"
        )
          mssg = `Diesel In should be Litre or Amount for DI No. ${diNo}`;
        else if (head === "driverPhone" && !validatePhoneNo(value))
          mssg = `Fill Valid Driver Phone No. for DI No. ${diNo}`;
        else if (index < 9 && !value)
          mssg = `${fileHeader[index]} is required for DI No. ${diNo}`;

        if (mssg) throw mssg;

        if (head === "date") value = moment(value, "DD-MM-YYYY").toISOString();

        tempVal[head] = value;
      }

      data.push(tempVal);
    }

    const insertData = await Trip.insertMany(data);

    removeFile(req.file.path);

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
      const { driverPhone, vehicleNo, dieselIn, cash, remarks, diNo } =
        req.body;

      if (!validatePhoneNo(driverPhone)) throw "Enter Valid Phone No.";

      if (dieselIn && dieselIn !== "Litre" && dieselIn !== "Amount")
        throw "Diesel In Field should be Litre or Amount";

      if (cash && !remarks) throw "Remarks field is mandatory if given Cash";

      const isExist = await Trip.findOne({ diNo });
      if (isExist) throw `DI No. ${diNo} already exist`;

      const insertData = await Trip.create({
        ...req.body,
        vehicleNo: vehicleNo.toUpperCase(),
        plant: user.plant,
      });

      return res
        .status(200)
        .json({ data: insertData, message: "Trip Added Successfully" });
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

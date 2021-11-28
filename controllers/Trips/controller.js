const { convertCSVToJSON } = require("../../utils/utils");
const { handleError, errorValidation } = require("../../utils/utils");
const Trip = require("../../models/Trip");

const fileHeader = [
  "DI No.",
  "LR No.",
  "Date",
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

    let data = await convertCSVToJSON(req.file.path);

    data = data.map((item) => {
      let tempVal = {};
      let diNo;
      let mssg = "";
      modelHeader.forEach((head, index) => {
        let value = item[fileHeader[index]];

        if (head === "diNo") {
          if (value) diNo = value;
          else mssg = "All Fields Should have DI No.";
        } else if (
          head === "dieselIn" &&
          value !== "Litre" &&
          value !== "Amount"
        )
          mssg = `Diesel In should be Litre or Amount for DI No. ${diNo}`;

        if (index < 9 && !value) {
          // required and value not exist
          mssg = `${fileHeader[index]} is required for DI No. ${diNo}`;
        }

        if (mssg) throw mssg;

        tempVal[head] = value;
      });
      return tempVal;
    });

    const insertData = await Trip.insertMany(data);
    fs.unlinkSync(path.join(req.file.path));
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

      const insertData = await Trip.create({
        ...req.body,
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
      message: `Trip${tripIds.length > 0 ? "s" : ""} Deleted Successfully`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

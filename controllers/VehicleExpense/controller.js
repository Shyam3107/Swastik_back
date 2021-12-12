const moment = require("moment");
const { convertCSVToJSON } = require("../../utils/utils");
const {
  handleError,
  errorValidation,
  validateBody,
  removeFile,
} = require("../../utils/utils");
const VehiclesExpense = require("../../models/VehiclesExpense");

const fileHeader = [
  "Date",
  "Vehicle No.",
  "Driver Name",
  "Cash",
  "Remarks",
  "Pump Name",
  "Diesel",
  "Diesel In",
  "Diesel For",
];

const modelHeader = [
  "date",
  "vehicleNo",
  "driverName",
  "cash",
  "remarks",
  "pumpName",
  "diesel",
  "dieselIn",
  "dieselFor",
];

module.exports.getExpenses = async (req, res) => {
  try {
    const user = req.user;
    const expenses = await VehiclesExpense.find();

    return res.status(200).json({ data: expenses });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports.uploadExpenses = async (req, res) => {
  try {
    const user = req.user;

    let dataToBeInsert = await convertCSVToJSON(req.file.path);

    let data = [];

    for await (item of dataToBeInsert) {
      let tempVal = { addedBy: user._id };
      let mssg = "";

      for await ([index, head] of modelHeader.entries()) {
        let value = item[fileHeader[index]];

        if (index < 5 && !value) mssg = `Enter Valid ${fileHeader[index]}`;

        if (
          item["Diesel"] &&
          head === "dieselIn" &&
          value !== "Litre" &&
          value !== "Amount"
        )
          mssg = `Diesel In should be Litre or Amount `;
        else if (item["Diesel"] && !item["Pump Name"])
          mssg = `Pump Name is mandatory if Diesel Taken`;

        if (mssg) throw mssg;

        if (head === "date") value = moment(value, "DD-MM-YYYY").toISOString();

        tempVal[head] = value;
      }

      data.push(tempVal);
    }

    const insertData = await VehiclesExpense.insertMany(data);

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

module.exports.addExpenses = [
  validateBody(["date", "vehicleNo", "driverName", "cash", "remarks"]),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      const insertData = await VehiclesExpense.create({
        ...req.body,
        addedBy: user._id,
      });

      return res.status(200).json({
        data: insertData,
        message: "Vehicles Expenses Added Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

module.exports.editExpenses = [
  validateBody(["date", "vehicleNo", "driverName", "cash", "remarks"]),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      const expenseId = req.body._id;
      const updateData = await VehiclesExpense.findByIdAndUpdate(
        { _id: expenseId },
        req.body
      );

      if (!updateData) throw "Record Not Found";

      return res.status(200).json({
        data: updateData,
        message: "Vehicles Expense Edited Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

module.exports.deleteExpenses = async (req, res) => {
  try {
    const errors = errorValidation(req, res);
    if (errors) {
      return null;
    }
    const user = req.user;
    const expenseIds = req.body;

    const deletedData = await VehiclesExpense.deleteMany({ _id: expenseIds });

    return res.status(200).json({
      data: deletedData,
      message: `Vehicles Expense${
        expenseIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
const moment = require("moment");
const { convertCSVToJSON } = require("../../utils/utils");
const {
  handleError,
  errorValidation,
  validateBody,
  removeFile,
} = require("../../utils/utils");
const OfficeExpense = require("../../models/OfficeExpense");

const fileHeader = ["Date", "Cash", "Remarks"];

const modelHeader = ["date", "cash", "remarks"];

module.exports.getExpenses = async (req, res) => {
  try {
    const user = req.user;
    const { expenseId } = req.query;
    let expenses;
    if (expenseId) {
      expenses = await OfficeExpense.findOne({ _id: expenseId });
    } else
      expenses = await OfficeExpense.find()
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ date: -1 });

    if (!expenses) throw "Record Nor Found";

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

        if (!value) mssg = `Enter Valid ${fileHeader[index]}`;

        if (mssg) throw mssg;

        if (head === "date") value = moment(value, "DD-MM-YYYY").toISOString();

        tempVal[head] = value;
      }

      data.push(tempVal);
    }

    const insertData = await OfficeExpense.insertMany(data);

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
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      const insertData = await OfficeExpense.create({
        ...req.body,
        addedBy: user._id,
      });

      return res.status(200).json({
        data: insertData,
        message: "Office Expenses Added Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

module.exports.editExpenses = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      const expenseId = req.body._id;
      const updateData = await OfficeExpense.findByIdAndUpdate(
        { _id: expenseId },
        req.body
      );

      if (!updateData) throw "Record Not Found";

      return res.status(200).json({
        data: updateData,
        message: "Office Expense Edited Successfully",
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

    const deletedData = await OfficeExpense.deleteMany({ _id: expenseIds });

    return res.status(200).json({
      data: deletedData,
      message: `Office Expense${
        expenseIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

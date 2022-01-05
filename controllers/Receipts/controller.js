const moment = require("moment");
const {
  handleError,
  errorValidation,
  validateBody,
  userRankQuery,
} = require("../../utils/utils");
const Receipt = require("../../models/Receipt");

const fileHeader = ["Date", "Amount", "Remarks"];

const modelHeader = ["date", "amount", "remarks"];

module.exports.getReceipt = async (req, res) => {
  try {
    const user = req.user;
    const { receiptId } = req.query;
    const userQuery = userRankQuery(user);
    let receipts;
    if (receiptId) {
      receipts = await Receipt.findOne({ _id: receiptId });
    } else
      receipts = await Receipt.find(userQuery)
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ date: -1 });

    if (!receipts) throw "Record Not Found";

    return res.status(200).json({ data: receipts });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports.addReceipt = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      const insertData = await Receipt.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      });

      return res.status(200).json({
        data: insertData,
        message: "Office Receipt Added Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

module.exports.editReceipt = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      const receiptId = req.body._id;
      const updateData = await Receipt.findByIdAndUpdate(
        { _id: receiptId },
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

module.exports.deleteReceipt = async (req, res) => {
  try {
    const errors = errorValidation(req, res);
    if (errors) {
      return null;
    }
    const user = req.user;
    const receiptIds = req.body;

    const deletedData = await Receipt.deleteMany({ _id: receiptIds });

    return res.status(200).json({
      data: deletedData,
      message: `Receipt${
        receiptIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const md5 = require("md5");
const {
  handleError,
  errorValidation,
  validateBody,
} = require("../../utils/utils");
const Account = require("../../models/Account");

const modelHeader = ["userName", "password", "location"];

module.exports.getAccount = async (req, res) => {
  try {
    const user = req.user;
    const { accountId } = req.query;
    let accounts;
    if (accountId) accounts = await Account.findById({ _id: accountId });
    else accounts = await Account.find({ addedBy: user._id });
    if (!accounts) throw "This Account does not exist in our record";

    return res.status(200).json({ data: accounts });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports.addAccount = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;
      if (req.body.password) req.body.password = md5(req.body.password);

      const insertData = await Account.create({
        ...req.body,
        addedBy: user._id,
      });

      return res
        .status(200)
        .json({ data: insertData, message: "Account Added Successfully" });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

module.exports.editAccount = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;
      if (req.body.password) req.body.password = md5(req.body.password);

      const accountId = req.body._id;
      const updateData = await Document.findByIdAndUpdate(
        { _id: accountId },
        req.body
      );

      if (!updateData) throw "Record Not Found";

      return res
        .status(200)
        .json({ data: updateData, message: "Account Edited Successfully" });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

module.exports.deleteAccount = async (req, res) => {
  try {
    const errors = errorValidation(req, res);
    if (errors) {
      return null;
    }
    const user = req.user;
    const accountIds = req.body;

    const deletedData = await Account.deleteMany({ _id: accountIds });

    return res.status(200).json({
      data: deletedData,
      message: `Account${
        documentIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

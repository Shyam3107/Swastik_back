const { validationResult, body } = require("express-validator");
const csv = require("csvtojson");
const path = require("path");
const fs = require("fs");

module.exports.convertCSVToJSON = async (csvFilePath) => {
  let jsonArray = await csv().fromFile(csvFilePath);
  return jsonArray;
};

module.exports.handleError = (res, error) => {
  if (typeof error === "string") return res.status(400).json({ error });
  return res.status(400).json({ error: error.message });
};

module.exports.errorValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errArray = errors.array();
    return res.status(400).json({
      errors: errArray.length > 0 ? errArray[0].msg : "Fill Mandatory Fields",
    });
  }
};

module.exports.validateBody = (field) => {
  return field.map((item) =>
    body(item).not().isEmpty().withMessage(`${item} field is required`)
  );
};

module.exports.validatePhoneNo = (phoneNo) => {
  const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
  return regex.test(phoneNo);
};

module.exports.removeFile = (filePath) => {
  fs.unlinkSync(path.join(filePath));
};

const { validationResult, body } = require("express-validator");
const csv = require("csvtojson");
const path = require("path");

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
    return res.status(400).json({ errors: errors.array() });
  }
};

module.exports.validateBody = (field) => {
  return field.map((item) =>
    body(item).not().isEmpty().withMessage(`${item} field is required`)
  );
};

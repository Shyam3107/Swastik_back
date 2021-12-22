const moment = require("moment");
const {
  handleError,
  errorValidation,
  validateBody,
} = require("../../utils/utils");
const Document = require("../../models/Document");

const fileHeader = [
  "Vehicle No.",
  "Tax Paid On",
  "Tax Paid Upto",
  "Insurance Paid On",
  "Insurance Paid Upto",
  "Fitness Paid On",
  "Fitness Paid Upto",
];

const modelHeader = [
  "vehicleNo",
  "taxPaidOn",
  "taxPaidUpto",
  "insurancePaidOn",
  "insurancePaidUpto",
  "fitnessPaidOn",
  "fitnessPaidUpto",
];

module.exports.getDocuments = async (req, res) => {
  try {
    const user = req.user;
    const { vehicleNo } = req.query;
    let documents;
    if (vehicleNo)
      documents = await Document.findOne({
        vehicleNo: vehicleNo.toUpperCase(),
      });
    else
      documents = await Document.find({ companyAdminId: user.companyAdminId })
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ date: -1 });
    if (!documents) throw "This Vechile does not exist in our record";

    return res.status(200).json({ data: documents });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports.uploadDocuments = async (req, res) => {
  try {
    const user = req.user;

    let dataToBeInsert = req.body.data;

    let data = [];
    let tempVehicleNo = {};

    for await (item of dataToBeInsert) {
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId };
      let vehicleNo;
      let mssg = "";

      for await ([index, head] of modelHeader.entries()) {
        let value = item[fileHeader[index]];

        if (head === "vehicleNo") {
          if (!value) mssg = "All Fields should have Vehicle No.";
          else if (tempVehicleNo[value])
            mssg = `Two rows can't have same Vehicle No. ${value}`;
          else {
            const isExist = await Document.findOne({ vehicleNo: value });
            if (isExist) mssg = `Vehicle No. ${value} already exist`;
            vehicleNo = value;
            tempVehicleNo[value] = true;
          }
        } else if (!value) mssg = `Enter Valid date for ${vehicleNo}`;

        if (mssg) throw mssg;

        if (index > 0) value = moment(value, "DD-MM-YYYY").toISOString();

        tempVal[head] = value;
      }

      data.push(tempVal);
    }

    const insertData = await Document.insertMany(data);

    return res.status(200).json({
      data: insertData,
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports.addDocuments = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      const insertData = await Document.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      });

      return res
        .status(200)
        .json({ data: insertData, message: "Document Added Successfully" });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

module.exports.editDocuments = [
  validateBody(modelHeader),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      const documentId = req.body._id;
      const updateData = await Document.findByIdAndUpdate(
        { _id: documentId },
        req.body
      );

      if (!updateData) throw "Record Not Found";

      return res
        .status(200)
        .json({ data: updateData, message: "Document Edited Successfully" });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

module.exports.deleteDocuments = async (req, res) => {
  try {
    const errors = errorValidation(req, res);
    if (errors) {
      return null;
    }
    const user = req.user;
    const documentIds = req.body;

    const deletedData = await Document.deleteMany({ _id: documentIds });

    return res.status(200).json({
      data: deletedData,
      message: `Document${
        documentIds.length > 1 ? "s" : ""
      } Deleted Successfully`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

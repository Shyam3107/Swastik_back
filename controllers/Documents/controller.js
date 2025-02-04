import moment from "moment";
import momentTimezone from "moment-timezone";
import { readdirSync } from "fs";
import {
  handleError,
  errorValidation,
  validateBody,
  columnHeaders,
  formatDateInDDMMYYY,
  parseResponse,
  validateDateWhileUpload,
} from "../../utils/utils.js";
import Document from "../../models/Document.js";
import Account from "../../models/Account.js";
import { fileHeader, modelHeader, validateArr } from "./constants.js";
import { INDIA_TZ } from "../../config/constants.js";
import { sendExcelFile } from "../../utils/sendFile.js";

momentTimezone.tz.setDefault(INDIA_TZ);

export const getDocuments = async (req, res) => {
  try {
    const { vehicleNo } = req.query;
    let documents;
    if (vehicleNo) {
      documents = await Document.findOne({
        companyAdminId: req?.user?.companyAdminId,
        vehicleNo: vehicleNo.toUpperCase(),
      }).populate({
        path: "addedBy",
        select: "_id",
      });
    } else {
      documents = await Document.find({
        companyAdminId: req?.user?.companyAdminId,
      })
        .populate({
          path: "addedBy",
          select: "location",
        })
        .sort({ vehicleNo: 1 });

      documents = parseResponse(documents);

      documents = documents.map((val) => {
        // Want to how as it in Documents table
        // thats why changing in expired and active
        let temp = {
          taxStatus: val.taxPaidUpto,
          insuranceStatus: val.insurancePaidUpto,
          fitnessStatus: val.fitnessPaidUpto,
          pollutionStatus: val.pollutionPaidUpto,
          permitStatus: val.permitPaidUpto,
          nationalPermitStatus: val.nationalPermitPaidUpto,
          isNationalPermit: val.isNationalPermit,
        };

        Object.keys(temp).forEach((key) => {
          if (key === "isNationalPermit") {
            temp[key] = temp[key] ? "YES" : "NO";
            return;
          }
          let diff = moment(temp[key]).diff(moment().endOf("day"), "days");
          temp[key] =
            diff < 0
              ? "Expired"
              : diff < 8
              ? `${diff} Day${diff > 1 ? "s" : ""}`
              : "Active";
        });
        return {
          _id: val._id,
          vehicleNo: val.vehicleNo,
          addedBy: val?.addedBy?.location,
          ...temp,
        };
      });
    }
    if (!documents) throw "This Vehicle does not exist in our record";

    const companyAdminId = req?.user?.companyAdminId._id;
    const documentsLink = await Account.findById({
      _id: companyAdminId,
    }).select({ documentsLink: 1 });

    return res
      .status(200)
      .json({ data: documents, documentsLink: documentsLink.documentsLink });
  } catch (error) {
    return handleError(res, error);
  }
};

export const uploadDocuments = async (req, res) => {
  const session = await Document.startSession();
  try {
    session.startTransaction();
    const user = req.user;

    let dataToBeInsert = req.body.data;

    let data = [];
    let tempVehicleNo = {};

    for (let ind = 0; ind < dataToBeInsert.length; ind++) {
      const item = dataToBeInsert[ind];
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId };
      let vehicleNo;
      let mssg = "";

      for (let index = 0; index < modelHeader.length; index++) {
        const head = modelHeader[index];
        let value = item[fileHeader[index]];

        if (head === "vehicleNo") {
          if (!value) mssg = `Vehicle No. Missing for row ${ind + 2}`;
          else if (tempVehicleNo[value])
            mssg = `Two rows can't have same Vehicle No. ${value}`;
          vehicleNo = value;
          tempVehicleNo[value] = true;
        } else if (!value)
          // Date should be there
          mssg = `Enter Valid value for ${vehicleNo} for ${fileHeader[index]} field`;

        // This condition is specific for isNationalPermit Field
        if (head === "isNationalPermit") {
          value = value.toUpperCase();
          if (value === "YES") value = true;
          else if (value === "NO") value = false;
          else {
            mssg = `Enter Valid value for ${vehicleNo} for isNaTionalPermit field`;
          }
        }

        if (mssg) throw mssg;

        if (head != "isNationalPermit" && index > 0) {
          value = validateDateWhileUpload(value, ind, false);
        }

        tempVal[head] = value;
      }

      data.push(tempVal);
    }

    const insertData = await Document.insertMany(data, { session });
    await session.commitTransaction();

    return res.status(200).json({
      message: `Successfully Inserted ${insertData.length} entries`,
    });
  } catch (error) {
    await session.abortTransaction();
    return handleError(res, error);
  } finally {
    await session.endSession();
  }
};

export const addDocuments = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }

      await Document.create({
        ...req.body,
        addedBy: req?.user?._id,
        companyAdminId: req?.user?.companyAdminId,
      });

      return res.status(200).json({ message: "Document Added Successfully" });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

export const editDocuments = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }

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

export const deleteDocuments = async (req, res) => {
  try {
    const errors = errorValidation(req, res);
    if (errors) {
      return null;
    }
    const documentIds = req.body;

    await Document.deleteMany({ _id: documentIds });

    return res.status(200).json({
      message: `Successfully Deleted ${documentIds.length} Document${
        documentIds.length > 1 ? "s" : ""
      }`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const downloadDocuments = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId;
    let data = await Document.find({
      companyAdminId,
    })
      .select({ _id: 0, __v: 0, companyAdminId: 0, createdAt: 0, updatedAt: 0 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ vehicleNo: 1 });

    data = parseResponse(data);

    data = data.map((val) => {
      return {
        ...val,
        taxPaidUpto: formatDateInDDMMYYY(val?.taxPaidUpto),
        insurancePaidUpto: formatDateInDDMMYYY(val?.insurancePaidUpto),
        fitnessPaidUpto: formatDateInDDMMYYY(val?.fitnessPaidUpto),
        pollutionPaidUpto: formatDateInDDMMYYY(val?.pollutionPaidUpto),
        permitPaidUpto: formatDateInDDMMYYY(val?.permitPaidUpto),
        nationalPermitPaidUpto: formatDateInDDMMYYY(
          val?.nationalPermitPaidUpto
        ),
        isNationalPermit: val?.isNationalPermit ? "YES" : "NO",
        addedBy: val?.addedBy?.location,
      };
    });

    const column1 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Tax Paid Upto", "taxPaidUpto"),
      columnHeaders("Insurance Paid Upto", "insurancePaidUpto"),
      columnHeaders("Fitness Paid Upto", "fitnessPaidUpto"),
      columnHeaders("Pollution Paid Upto", "pollutionPaidUpto"),
      columnHeaders("Permit Paid Upto", "permitPaidUpto"),
      columnHeaders("National Permit Paid Upto", "nationalPermitPaidUpto"),
      columnHeaders("Is National Permit", "isNationalPermit"),
    ];

    return sendExcelFile(res, [column1], [data], ["Documents"]);
  } catch (error) {
    return handleError(res, error);
  }
};

export const downloadMissingDocuments = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId;
    let data = [];

    const dirLink =
      "https://drive.google.com/drive/folders/1uxfoV2iHh1jhhMGRQIJMChbuwrrrXMIY?usp=drive_link";

    // Get all PUC
    let PUCFiles = readdirSync(dirLink).map((file) => {
      console.log(file);
      return file;
    });

    const column1 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Tax Paid Upto", "taxPaidUpto"),
      columnHeaders("Insurance Paid Upto", "insurancePaidUpto"),
      columnHeaders("Fitness Paid Upto", "fitnessPaidUpto"),
      columnHeaders("Pollution Paid Upto", "pollutionPaidUpto"),
      columnHeaders("Permit Paid Upto", "permitPaidUpto"),
      columnHeaders("National Permit Paid Upto", "nationalPermitPaidUpto"),
      columnHeaders("Is National Permit", "isNationalPermit"),
    ];

    return sendExcelFile(res, [column1], [data], ["Documents"]);
  } catch (error) {
    return handleError(res, error);
  }
};

// Complete the Vehicle Number and return the File
export const completeVehicleNumber = async (req, res) => {
  try {
    const data = req.body.data ?? [];

    // Fetch the Vehicle no.
    let documents = await Document.find({
      companyAdminId: req?.user?.companyAdminId,
    })
      .select({ vehicleNo: 1 })
      .sort({ vehicleNo: 1 });

    documents = parseResponse(documents);

    let vehicleMap = {};
    documents.forEach((val) => {
      const vehicleNo = val?.vehicleNo?.split(" ")[0];
      vehicleMap[vehicleNo.substr(-4)] = vehicleNo;
    });

    // Complete the Vehicle Number
    let finalData = [];

    data.forEach((row) => {
      finalData.push({ vehicleNo: vehicleMap[row["Vehicle No."]] });
    });

    const column1 = [columnHeaders("Vehicle No.", "vehicleNo")];

    return sendExcelFile(res, [column1], [finalData], ["Entries"]);
  } catch (error) {
    return handleError(res, error);
  } finally {
  }
};

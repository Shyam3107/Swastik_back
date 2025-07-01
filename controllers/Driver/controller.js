import {
  columnHeaders,
  errorValidation,
  formatDateInDDMMYYY,
  handleError,
  parseResponse,
  validateAadharCard,
  validateAlphaNumeric,
  validateBody,
  validateDateWhileUpload,
  validatePhoneNo,
} from "../../utils/utils.js";
import Driver from "../../models/Driver.js";
import { modelHeader, validateArr, fileHeader } from "./constants.js";
import moment from "moment";

// Get the list of Drivers
export const getDrivers = async (req, res) => {
  try {
    const user = req.user;
    const { driverId } = req.query;

    let query = {
      companyAdminId: user.companyAdminId,
    };

    let select = {
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
      companyAdminId: 0,
      lastUpdatedBy: 0,
    };

    let driverList;

    if (driverId) {
      driverList = await Driver.findById({ _id: driverId }).select(select);
    } else {
      driverList = await Driver.find(query)
        .select(select)
        .populate({
          path: "guarantor",
          select: "name remarks dlNo",
        })
        .sort({ name: 1 });
      driverList = parseResponse(driverList);
      driverList = driverList.map((val) => {
        return {
          ...val,
          aadharCardDOB: formatDateInDDMMYYY(val.aadharCardDOB),
          dlDOB: formatDateInDDMMYYY(val.dlDOB),
          dlValidity: formatDateInDDMMYYY(val.dlValidity),
          isDriving: val.isDriving ? "Yes" : "No",
          defaulter: val.defaulter ? "Yes" : "No",
          guarantor: val?.guarantor
            ? val.guarantor.name + " - " + val.guarantor.dlNo
            : "",
        };
      });
    }

    return res.status(200).json({ data: driverList });
  } catch (error) {
    return handleError(res, error);
  }
};

// Upload the Excel file containing the Driver details
export const uploadDrivers = async (req, res) => {
  const session = await Driver.startSession();
  try {
    session.startTransaction();
    const user = req.user;

    let dataToBeInsert = req.body.data;

    let data = [];
    let tempDriver = {};

    for (let i = 0; i < dataToBeInsert.length; i++) {
      const item = dataToBeInsert[i];
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId };
      let mssg = "";

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index];
        let value = item[fileHeader[index]];

        if (head === "dlNo") {
          if (tempDriver[value])
            mssg = `Two Records can't have same DL No: ${value}`;
          tempDriver[value] = true;
        }

        if (validateArr.includes(head) && !value)
          mssg = `Enter Valid ${fileHeader[index]} in row: ${i + 2}`;

        if (head === "driverPhone" && !validatePhoneNo(value)) {
          mssg = `Enter Valid ${fileHeader[index]} in row: ${i + 2}`;
        }
        // If Home Phone is not provided, we will set it to empty string
        if (head === "homePhone" && value && !validatePhoneNo(value)) {
          mssg = `Enter Valid ${fileHeader[index]} in row: ${i + 2}`;
        }

        // If Aadhar Card No is not provided, we will set it to empty string
        if (head === "aadharCardNo" && value && !validateAadharCard(value)) {
          mssg = `Enter Valid ${fileHeader[index]} in row: ${i + 2}`;
        }

        if (head === "aadharCardDOB" && value)
          value = validateDateWhileUpload(value, i + 2, false);

        if (head === "dlDOB" || head === "dlValidity") {
          value = validateDateWhileUpload(value, i + 2, false);
        }

        if (head === "dlNo" && !validateAlphaNumeric(value))
          mssg = `DL No. should be Alpha Numeric in row: ${i + 2}`;

        if (mssg) throw mssg;

        tempVal[head] = value;
      }

      data.push(tempVal);
    }

    const insertData = await Driver.insertMany(data, { session });
    await session.commitTransaction();

    return res.status(200).json({
      entries: insertData.length,
      message: `Successfully Inserted ${insertData.length} entries`,
    });
  } catch (error) {
    await session.abortTransaction();
    return handleError(res, error);
  } finally {
    await session.endSession();
  }
};

// Add the Driver
export const addDriver = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      const { driverPhone, dlValidity, dlNo } = req.body;

      if (!validatePhoneNo(driverPhone)) throw "Enter Valid Driver Phone No";

      if (moment(dlValidity).isBefore(moment()))
        throw "DL Validity should be greater than today";

      if (!validateAlphaNumeric(dlNo)) throw "DL No. should be Alpha Numeric";

      await Driver.create({
        ...req.body,
        driverName: req.body.name,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      });

      return res.status(200).json({
        message: "Driver Added Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

// Edit the Driver Details
export const editDriver = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }

      const driverId = req.body._id;

      const { driverPhone, aadharCardNo, homePhone, dlValidity } = req.body;

      if (!validatePhoneNo(driverPhone)) throw "Enter Valid Driver Phone No";

      if (!validatePhoneNo(homePhone)) throw "Enter Valid Home Phone No";

      if (moment(dlValidity).isBefore(moment()))
        throw "DL Validity should be greater than today";

      if (aadharCardNo?.toString().length !== 12)
        throw "Aadhar Card No should be of 12 digits";

      const updateData = await Driver.findByIdAndUpdate(
        { _id: driverId },
        req.body
      );

      if (!updateData) throw "Record Not Found";

      return res.status(200).json({
        message: "Driver Edited Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

// Delete the Driver
export const deleteDriver = async (req, res) => {
  try {
    const errors = errorValidation(req, res);
    if (errors) {
      return null;
    }
    const driverIds = req.body;
    if (!driverIds || driverIds.length === 0) throw "No Driver Ids Provided";

    await Driver.deleteMany({ _id: driverIds });

    return res.status(200).json({
      message: `Successfully Deleted ${driverIds.length} Driver${
        driverIds.length > 1 ? "s" : ""
      }`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// Download the Driver List
export const downloadDriver = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId;
    let data = await Driver.find({
      companyAdminId,
    })
      .select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0, companyAdminId: 0 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ name: 1 });

    data = parseResponse(data);

    data = data.map((val) => {
      return {
        ...val,
        aadharCardDOB: formatDateInDDMMYYY(val.aadharCardDOB),
        dlDOB: formatDateInDDMMYYY(val.dlDOB),
        dlValidity: formatDateInDDMMYYY(val.dlValidity),
        addedBy: val?.addedBy?.location,
      };
    });

    const column1 = [
      columnHeaders("Name", "name"),
      columnHeaders("Driver Phone", "driverPhone"),
      columnHeaders("Aadhar Card No", "aadharCardNo"),
      columnHeaders("Aadhar Card DOB", "aadharCardDOB"),
      columnHeaders("DL No", "dlNo"),
      columnHeaders("DL DOB", "dlDOB"),
      columnHeaders("DL Validity", "dlValidity"),
      columnHeaders("Home Phone", "homePhone"),
      columnHeaders("Relation", "relation"),
      columnHeaders("Guarantor", "guarantor"),
      columnHeaders("Remarks", "remarks"),
      columnHeaders("Is Driving", "isDriving"),
      columnHeaders("Added By", "addedBy"),
    ];
    return sendExcelFile(res, [column1], [data], ["Driver"]);
  } catch (error) {
    return handleError(res, error);
  }
};

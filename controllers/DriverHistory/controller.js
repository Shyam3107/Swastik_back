import {
  handleError,
  errorValidation,
  validateBody,
  parseResponse,
  columnHeaders,
  formatDateInDDMMYYY,
} from "../../utils/utils.js";
import { sendExcelFile } from "../../utils/sendFile.js";
import { modelHeader, fileHeader, validateArr } from "./constants.js";
import DriverHistory from "../../models/DriverHistory.js";
import Trips from "../../models/Trip.js";
import mongoose from "mongoose";
import moment from "moment";
import Driver from "../../models/Driver.js";

export const getDriverHistory = async (req, res) => {
  try {
    const user = req.user;

    let details = await DriverHistory.find({
      companyAdminId: user.companyAdminId,
    })
      .select({
        vehicleNo: 1,
        driver: 1,
        driverJoiningDate: 1,
      })
      .populate({
        path: "driver",
        select: "name dlNo driverPhone",
      })
      .populate({
        path: "vehicleNo",
        select: "vehicleNo",
      })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ vehicleNo: 1 });
    details = parseResponse(details);
    details = details.map((val) => {
      return {
        ...val,
        vehicleNo: val?.vehicleNo?.vehicleNo,
        vehicleId: val?.vehicleNo?._id,
        driverId: val?.driver?._id,
        driver: val?.driver?.name + " - " + val?.driver?.dlNo,
        driverJoiningDate: formatDateInDDMMYYY(val.driverJoiningDate),
        driverPhone: val?.driver?.driverPhone ?? "",
        driverName: val?.driver?.name ?? "",
        addedBy: val?.addedBy?.location,
      };
    });

    if (!details) throw "Record Not Found";

    return res.status(200).json({ data: details });
  } catch (error) {
    return handleError(res, error);
  }
};

export const addDriverHistory = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      await DriverHistory.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      });

      return res.status(200).json({
        message: "Driver History Added Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

export const editDriverHistory = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }

      const vehicleId = req.body._id;

      const updateData = await DriverHistory.findByIdAndUpdate(
        { _id: vehicleId },
        req.body
      );

      if (!updateData) throw "Record Not Found";

      return res.status(200).json({
        message: "Driver History Edited Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

export const deleteDriverHistory = async (req, res) => {
  try {
    const errors = errorValidation(req, res);
    if (errors) {
      return null;
    }
    const vehicleIds = req.body;

    await DriverHistory.deleteMany({ _id: vehicleIds });

    return res.status(200).json({
      message: `Successfully Deleted the Entries`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const downloadDriverHistory = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId;
    let data = await DriverHistory.find({
      companyAdminId,
    })
      .select({
        vehicleNo: 1,
        driver: 1,
        driverJoiningDate: 1,
      })
      .populate({
        path: "driver",
        select: "name dlNo driverPhone",
      })
      .populate({
        path: "vehicleNo",
        select: "vehicleNo",
      })
      .sort({ vehicleNo: 1 });
    data = parseResponse(data);
    data = data.map((val) => {
      return {
        vehicleNo: val?.vehicleNo?.vehicleNo,
        vehicleId: val?.vehicleNo?._id,
        driverId: val?.driver?._id,
        driver: val?.driver?.name + " - " + val?.driver?.dlNo,
        driverJoiningDate: formatDateInDDMMYYY(val.driverJoiningDate),
        driverPhone: val?.driver?.driverPhone ?? "",
        driverName: val?.driver?.name ?? "",
        addedBy: val?.addedBy?.location,
      };
    });

    const column1 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Driver", "driver"),
      columnHeaders("Driver Joining Date", "driverJoiningDate"),
      columnHeaders("Added By", "addedBy"),
    ];
    return sendExcelFile(res, [column1], [data], ["DriverHistory"]);
  } catch (error) {
    return handleError(res, error);
  }
};

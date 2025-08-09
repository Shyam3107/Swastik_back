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
import Fleet from "../../models/Fleet.js";
import Trips from "../../models/Trip.js";
import mongoose from "mongoose";
import moment from "moment";

export const getFleet = async (req, res) => {
  try {
    const user = req.user;
    let { vehicleNo } = req.query;

    let details;
    if (vehicleNo) {
      details = await Fleet.findOne({
        vehicleNo,
        companyAdminId: user.companyAdminId,
      }).select({
        vehicleNo: 1,
        owner: 1,
        ownerName: 1,
        driver: 1,
        driverJoiningDate: 1,
        remarks: 1,
      });
    } else {
      details = await Fleet.find({
        companyAdminId: user.companyAdminId,
      })
        .select({
          vehicleNo: 1,
          ownerName: 1,
          addedBy: 1,
          owner: 1,
          driver: 1,
          driverJoiningDate: 1,
          remarks: 1,
        })
        .populate({
          path: "driver",
          select: "name dlNo driverPhone",
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
          driver: val?.driver?.name + " - " + val?.driver?.dlNo,
          driverJoiningDate: formatDateInDDMMYYY(val.driverJoiningDate),
          driverPhone: val?.driver?.driverPhone ?? "",
          driverName: val?.driver?.name ?? "",
          addedBy: val?.addedBy?.location,
        };
      });
    }

    if (!details) throw "Record Not Found";

    return res.status(200).json({ data: details });
  } catch (error) {
    return handleError(res, error);
  }
};

export const uploadFleet = async (req, res) => {
  const session = await Fleet.startSession();
  try {
    session.startTransaction();
    const user = req.user;

    let dataToBeInsert = req.body.data;

    let data = [];
    let tempVehicleNo = {};

    for (let i = 0; i < dataToBeInsert.length; i++) {
      const item = dataToBeInsert[i];
      let tempVal = { addedBy: user._id, companyAdminId: user.companyAdminId };
      let mssg = "";

      for (let index = 0; index < modelHeader.length; index++) {
        let head = modelHeader[index];
        let value = item[fileHeader[index]];

        // Vehicle No and owner is Mandatory
        if (index < 2 && !value)
          mssg = `Enter Valid ${fileHeader[index]} in row: ${i + 2}`;

        if (head === "ownerName" && item["Owner"] === "ATTACHED" && !value)
          mssg = `Owner Name is required for Attached Vehicle for row: ${
            i + 2
          }`;

        // Check for duplicate records inside Datatobeinsert
        if (head === "vehicleNo") {
          if (tempVehicleNo[value])
            mssg = `Two Records can't have same Vehicle No: ${value}`;
          tempVehicleNo[value] = true;
        }
        if (mssg) throw mssg;

        tempVal[head] = value;
      }

      data.push(tempVal);
    }

    const insertData = await Fleet.insertMany(data, { session });
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

export const addFleet = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }
      const user = req.user;

      if (
        req.body.owner === "ATTACHED" &&
        (!req.body.ownerName || req.body.ownerName.length === 0)
      )
        throw "Owner Name is required in case of Attached Vehicle";

      // Check if Driver is already attached to a vehicle
      if (req.body.driver) {
        const existingVehicle = await Fleet.findOne({
          driver: req.body.driver,
          vehicleNo: { $ne: req.body.vehicleNo },
        });
        if (existingVehicle) {
          throw `Driver is already attached to vehicle ${existingVehicle.vehicleNo}`;
        }
      }

      await Fleet.create({
        ...req.body,
        addedBy: user._id,
        companyAdminId: user.companyAdminId,
      });

      return res.status(200).json({
        message: "Vehicle Added Successfully in Fleet",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

export const editFleet = [
  validateBody(validateArr),
  async (req, res) => {
    try {
      const errors = errorValidation(req, res);
      if (errors) {
        return null;
      }

      const vehicleId = req.body._id;

      if (
        req.body.owner === "ATTACHED" &&
        (!req.body.ownerName || req.body.ownerName.length === 0)
      )
        throw "Owner Name is required in case of Attached Vehicle";

      // Check if Driver is already attached to a vehicle
      if (req.body.driver) {
        const existingVehicle = await Fleet.findOne({
          driver: req.body.driver,
          vehicleNo: { $ne: req.body.vehicleNo },
        });
        if (existingVehicle) {
          throw `Driver is already attached to vehicle ${existingVehicle.vehicleNo}`;
        }
      }

      const updateData = await Fleet.findByIdAndUpdate(
        { _id: vehicleId },
        req.body
      );

      if (!updateData) throw "Record Not Found";

      return res.status(200).json({
        message: "Vehicle Edited Successfully",
      });
    } catch (error) {
      return handleError(res, error);
    }
  },
];

export const deleteFleet = async (req, res) => {
  try {
    const errors = errorValidation(req, res);
    if (errors) {
      return null;
    }
    const vehicleIds = req.body;

    await Fleet.deleteMany({ _id: vehicleIds });

    return res.status(200).json({
      message: `Successfully Deleted ${vehicleIds.length} Vehicle${
        vehicleIds.length > 1 ? "s" : ""
      } From Fleet`,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const downloadFleet = async (req, res) => {
  try {
    const companyAdminId = req?.user?.companyAdminId;
    let data = await Fleet.find({
      companyAdminId,
    })
      .select({ _id: 0, vehicleNo: 1, owner: 1, addedBy: 1, ownerName: 1 })
      .populate({
        path: "addedBy",
        select: "location",
      })
      .sort({ vehicleNo: 1 });

    data = parseResponse(data);

    data = data.map((val) => {
      return {
        ...val,
        addedBy: val?.addedBy?.location,
      };
    });

    const column1 = [
      columnHeaders("Vehicle No.", "vehicleNo"),
      columnHeaders("Owner", "owner"),
      columnHeaders("Owner Name", "ownerName"),
      columnHeaders("Added By", "addedBy"),
    ];
    return sendExcelFile(res, [column1], [data], ["Fleet"]);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getFleetListForTrips = async (req, res) => {
  try {
    const user = req.user;

    let details = await Fleet.find({
      companyAdminId: user.companyAdminId,
    })
      .select({
        vehicleNo: 1,
        driver: 1,
      })
      .populate({
        path: "driver",
        select: "name driverPhone",
      })
      .sort({ vehicleNo: 1 });
    details = parseResponse(details);
    details = details.map((val) => {
      return {
        ...val,
        driverName: val?.driver?.name ?? "",
        driverPhone: val?.driver?.driverPhone ?? "",
      };
    });

    // Taking Last 3 months vehicles only
    const from = moment().startOf("month").subtract(3, "months").toISOString();

    const fleetVehicles = await Fleet.find({
      companyAdminId: user.companyAdminId,
    })
      .select({
        vehicleNo: 1,
        driver: 1,
        _id: 0,
      })
      .distinct("vehicleNo");

    let marketVehicles = await Trips.aggregate([
      {
        $match: {
          companyAdminId: mongoose.Types.ObjectId(user?.companyAdminId?._id),
          date: { $gte: new Date(from) },
          vehicleNo: { $nin: fleetVehicles },
        },
      },
      {
        $group: {
          _id: {
            vehicleNo: "$vehicleNo",
          },
          driverName: { $push: "$driverName" },
          driverPhone: { $push: "$driverPhone" },
        },
      },
      {
        $project: {
          _id: 0,
          vehicleNo: "$_id.vehicleNo",
          driverName: { $arrayElemAt: ["$driverName", 0] },
          driverPhone: { $arrayElemAt: ["$driverPhone", 0] },
        },
      },
    ]);

    if (!details) throw "Record Not Found";

    return res.status(200).json({ data: [...details, ...marketVehicles] });
  } catch (error) {
    return handleError(res, error);
  }
};

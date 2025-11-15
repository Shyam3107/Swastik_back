import mongoose from "mongoose";
const { Schema, model } = mongoose;

const schema = new Schema(
  {
    vehicleNo: {
      type: Schema.Types.ObjectId,
      ref: "Fleet",
      default: null,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "DriverList",
      default: null,
    },
    driverJoiningDate: {
      type: Date,
      default: null,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    companyAdminId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  { timestamps: true }
);

export default model("DriverHistory", schema);

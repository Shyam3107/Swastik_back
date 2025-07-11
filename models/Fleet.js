import mongoose from "mongoose";
const { Schema, model } = mongoose;

const schema = new Schema(
  {
    vehicleNo: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
      minlength: [9, "Vehicle number must be at least 9 characters long"],
      maxlength: [10, "Vehicle number must not exceed 10 characters"],
    },
    owner: {
      type: String,
      required: true,
      enum: ["SELF", "ATTACHED"],
    },
    ownerName: {
      type: String,
      uppercase: true,
      trim: true,
    },
    remarks: {
      type: String,
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

schema.index({ vehicleNo: 1, companyAdminId: 1 }, { unique: true });

const Fleet = model("Fleet", schema);

export default Fleet;

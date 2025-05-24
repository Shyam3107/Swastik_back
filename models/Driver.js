import mongoose from "mongoose";
const { Schema, model } = mongoose;

const driverSchema = new Schema(
  {
    name: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    driverPhone: {
      type: String,
      required: true,
    },
    aadharCardNo: {
      type: Number,
      required: true,
    },
    aadharCardDOB: {
      type: Date,
      required: true,
    },
    dlNo: {
      type: String,
      required: true,
    },
    dlDOB: {
      type: Date,
      required: true,
    },
    dlValidity: {
      type: Date,
      required: true,
    },
    homePhone: {
      type: String,
      required: true,
    },
    relation: {
      type: String,
      required: true,
    },
    guarantor: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
    },
    isDriving: {
      type: Boolean,
      required: true,
      default: false,
    },
    defaulter:{
      type: Boolean,
      required: true,
      default: false,
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

driverSchema.index({ dlNo: 1, companyAdminId: 1 }, { unique: true });

const Driver = model("DriverList", driverSchema);

export default Driver;

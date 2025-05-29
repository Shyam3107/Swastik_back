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
      required: [true, "Enter Valid Driver Phone"],
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: "Enter Valid Driver Phone No.",
      },
    },
    aadharCardNo: {
      type: Number,
      required: true,
      unique: true,
    },
    aadharCardDOB: {
      type: Date,
      required: true,
    },
    dlNo: {
      type: String,
      required: true,
      trim: true,
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
      type: Schema.Types.ObjectId,
      ref: "DriverList",
      default: null,
    },
    remarks: {
      type: String,
    },
    isDriving: {
      type: Boolean,
      required: true,
      default: false,
    },
    defaulter: {
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

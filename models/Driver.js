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
      required: [true, "Driver Phone no. is required"],
      validate: {
        validator: function (v) {
          return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(
            v
          );
        },
        message: "Enter Valid Driver Phone No.",
      },
    },
    aadharCardNo: {
      type: Number,
    },
    aadharCardDOB: {
      type: Date,
      default: null,
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
    },
    relation: {
      type: String,
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

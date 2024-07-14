import mongoose from "mongoose"
const { Schema, model } = mongoose

const driverSchema = new Schema(
  {
    vehicleNo: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    driverName: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    driverPhone: {
      type: String,
      required: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    lastUpdatedBy: {
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
)

driverSchema.index({ vehicleNo: 1, companyAdminId: 1 }, { unique: true })

const Driver = model("Driver", driverSchema)

export default Driver

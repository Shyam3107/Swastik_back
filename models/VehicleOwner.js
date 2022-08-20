import mongoose from "mongoose"
const { Schema, model } = mongoose

const schema = new Schema(
  {
    vehicleNo: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    owner: {
      type: String,
      required: true,
      enum: ["SELF", "MARKET"],
    },
    remarks: {
      type: String,
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
)

schema.index({ vehicleNo: 1, companyAdminId: 1 }, { unique: true })

const VehicleOwner = model("VehicleOwner", schema)

export default VehicleOwner

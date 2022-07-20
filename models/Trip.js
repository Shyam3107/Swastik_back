import mongoose from "mongoose"
const { Schema, model } = mongoose

const tripSchema = new Schema(
  {
    diNo: {
      type: Number,
      required: true,
    },
    lrNo: {
      type: String,
      trim: true,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    loadingPoint: {
      type: String,
      trim: true,
      required: true,
    },
    partyName: {
      type: String,
      trim: true,
      required: true,
    },
    location: {
      type: String,
      trim: true,
      required: true,
    },
    material: {
      type: String,
      trim: true,
      required: true,
    },
    vehicleNo: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    driverName: {
      type: String,
      trim: true,
      required: true,
    },
    driverPhone: {
      type: String,
      required: true,
    },
    pumpName: {
      trim: true,
      type: String,
    },
    diesel: {
      type: Number,
    },
    dieselIn: {
      type: String,
      enum: ["Litre", "Amount"],
    },
    cash: {
      type: Number,
    },
    remarks: {
      trim: true,
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

tripSchema.index({ diNo: 1, companyAdminId: 1 }, { unique: true })

const Trip = model("Trip", tripSchema)

export default Trip

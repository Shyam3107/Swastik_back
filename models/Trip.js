import mongoose from "mongoose";
const { Schema, model } = mongoose;

const tripSchema = new Schema(
  {
    diNo: {
      type: String,
      trim: true,
      uppercase: true,
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
    partyName2: {
      type: String,
      trim: true,
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
      minlength: [9, "Vehicle number must be at least 9 characters long"],
      maxlength: [10, "Vehicle number must not exceed 10 characters"],
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.001,
    },
    bags: {
      type: Number,
    },
    shortage: {
      type: Number,
    },
    shortageAmount: {
      type: Number,
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
      enum: ["Litre", "Amount", null, "", undefined],
    },
    cash: {
      type: Number,
      min: 0,
    },
    remarks: {
      trim: true,
      type: String,
    },
    billingRate: {
      type: Number,
      default: 0,
    },
    rate: {
      type: Number,
      default: 0,
    },
    eWayBillNo: {
      trim: true,
      type: String,
    },
    eWayBillExpiry: {
      type: Date,
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

tripSchema.index({ diNo: 1, companyAdminId: 1 }, { unique: true });

const Trip = model("Trip", tripSchema);

export default Trip;

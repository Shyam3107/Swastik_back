const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    diNo: {
      type: Number,
      required: true,
      unique: true,
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
      enum: ["Litre", "Amount", null, "", undefined],
      default: null,
    },
    cash: {
      type: Number,
    },
    remarks: {
      trim: true,
      type: String,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  { timestamps: true }
);

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;

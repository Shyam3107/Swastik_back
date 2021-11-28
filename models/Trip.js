const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    diNo: {
      type: Number,
      required: true,
    },
    lrNo: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    partyName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    vehicleNo: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    plant: {
      type: String,
      required: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    driverPhone: {
      type: String,
      required: true,
    },
    pumpName: {
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
      type: String,
    },
  },
  { timestamps: true }
);

const Trip = mongoose.model("Trip", tripSchema);

module.exports = Trip;

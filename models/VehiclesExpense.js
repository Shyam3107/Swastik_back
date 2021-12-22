const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    vehicleNo: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
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
    dieselFor: {
      type: String,
      enum: ["Driver", "Vehicle", null, "", undefined],
    },
    amount: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      required: true,
      default: "",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    companyAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  { timestamps: true }
);

const VehiclesExpense = mongoose.model("VehiclesExpense", expenseSchema);

module.exports = VehiclesExpense;

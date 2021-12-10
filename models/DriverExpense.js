const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    cash: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  { timestamps: true }
);

const DriverExpense = mongoose.model("DriverExpense", expenseSchema);

module.exports = DriverExpense;

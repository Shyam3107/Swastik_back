import mongoose from "mongoose"
const { Schema, model } = mongoose

const expenseSchema = new Schema(
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

const VehiclesExpense = model("VehiclesExpense", expenseSchema)

export default VehiclesExpense

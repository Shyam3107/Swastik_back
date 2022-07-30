import mongoose from "mongoose"
const { Schema, model } = mongoose

const dieselSchema = new Schema(
  {
    date: {
      type: Date,
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
      default: 0,
    },
    fuel: {
      type: String,
      enum: ["Diesel", "Petrol"],
      required: true,
      default: "Diesel",
    },
    pumpName: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
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

dieselSchema.index(
  { date: 1, vehicleNo: 1, quantity: 1, amount: 1, pumpName: 1 },
  { unique: true }
)

const Diesel = model("Diesel", dieselSchema)

export default Diesel

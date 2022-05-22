import mongoose from "mongoose"
const { Schema, model } = mongoose

const expenseSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      required: true,
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

const OfficeExpense = model("OfficeExpense", expenseSchema)

export default OfficeExpense

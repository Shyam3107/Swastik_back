import mongoose from "mongoose"
const { Schema, model } = mongoose

const schema = new Schema(
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

const Receipt = model("Receipt", schema)

export default Receipt

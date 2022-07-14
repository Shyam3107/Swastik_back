import mongoose from "mongoose"
const { Schema, model } = mongoose

const schema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    diNo: {
      type: Number,
      required: true,
    },
    billingRate: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    paidTo: {
      type: String,
      required: true,
    },
    accountNo: {
      type: String,
      required: true,
    },
    ifsc: {
      type: String,
    },
    cash: {
      type: String,
    },
    diesel: {
      type: String,
    },
    advance: {
      type: String,
    },
    tds: {
      type: String,
    },
    bagShortage: {
      type: String,
    },
    total: {
      type: Number,
      required: true,
    },
    remarks: {
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

const Voucher = model("Voucher", schema)

export default Voucher

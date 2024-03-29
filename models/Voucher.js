import mongoose from "mongoose"
const { Schema, model } = mongoose

const schema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    diNo: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
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
    dieselRate: {
      type: Number,
      default: 0,
    },
    tds: {
      type: Number,
      default: 0,
    },
    shortage: {
      type: Number,
      default: 0,
    },
    other: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
    },
    paidOn: {
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
)

schema.index({ diNo: 1, companyAdminId: 1 }, { unique: true })

const Voucher = model("Voucher", schema)

export default Voucher

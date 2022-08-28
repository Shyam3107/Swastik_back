import mongoose from "mongoose"
const { Schema, model } = mongoose

const schema = new Schema(
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
    amount: {
      type: Number,
      required: true,
    },
    shopName: {
      type: String,
      trim: true,
      required: true,
    },
    remarks: {
      type: String,
      required: true,
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

schema.index({ vehicleNo: 1, companyAdminId: 1 })
schema.index({ shopName: 1, companyAdminId: 1 })

const HardwareShopBill = model("HardwareShopBill", schema)

export default HardwareShopBill

import mongoose from "mongoose"
const { Schema, model } = mongoose

const schema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    vehicleNo: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    personName: {
      type: String,
      trim: true,
      required: true,
    },
    personPhone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["RECEIVED", "ISSUED"],
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

//schema.index({ vehicleNo: 1, companyAdminId: 1 })

const Logistic = model("Logistic", schema)

export default Logistic

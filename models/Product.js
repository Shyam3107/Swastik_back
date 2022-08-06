import mongoose from "mongoose"
const { Schema, model } = mongoose

const productSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    name: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
      unique: true,
    },
    quantity: {
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

const Product = model("Product", productSchema)

export default Product

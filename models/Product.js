import mongoose from "mongoose"
const { Schema, model } = mongoose

const productSchema = new Schema(
  {
    name: {
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

productSchema.index({ name: 1, companyAdminId: 1 }, { unique: true })

const Product = model("Product", productSchema)

export default Product

import mongoose from "mongoose"
const { Schema, model } = mongoose

const accountSchema = new Schema(
  {
    userName: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    location: {
      type: String,
      uppercase: true,
      trim: true,
    },
    consignor: {
      type: String,
      uppercase: true,
      trim: true,
    },
    branch: {
      type: String,
      uppercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    tptCode: {
      type: String,
      trim: true,
    },
    documentsLink: {
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
    access: {
      type: [String],
      required: true,
      default: [],
      enum: [
        "TRIPS",
        "VOUCHERS",
        "DOCUMENTS",
        "RECEIPTS",
        "OFFICE EXPENSES",
        "VEHICLE EXPENSES",
        "ACCOUNTS",
      ],
    },
    operations: {
      type: [String],
      required: true,
      default: [],
      enum: ["CREATE", "UPDATE", "READ", "DELETE"],
    },
    showTrips: {
      type: String,
      enum: [null, undefined, "ALL", "SELF"],
    },
  },
  { timestamps: true }
)

const Account = model("Account", accountSchema)

export default Account

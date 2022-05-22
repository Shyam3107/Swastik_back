import mongoose from "mongoose"
const { Schema, model } = mongoose

const documentSchema = new Schema(
  {
    vehicleNo: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
    },
    taxPaidUpto: {
      type: Date,
      required: true,
    },
    insurancePaidUpto: {
      type: Date,
      required: true,
    },
    fitnessPaidUpto: {
      type: Date,
      required: true,
    },
    pollutionPaidUpto: {
      type: Date,
      required: true,
    },
    permitPaidUpto: {
      type: Date,
      required: true,
    },
    nationalPermitPaidUpto: {
      type: Date,
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

const Document = model("Document", documentSchema)

export default Document

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
    isNationalPermit: {
      type: Boolean,
      default: false
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

documentSchema.index({ vehicleNo: 1, companyAdminId: 1 }, { unique: true })

const Document = model("Document", documentSchema)

export default Document

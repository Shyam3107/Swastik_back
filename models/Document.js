const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    vehicleNo: {
      type: String,
      uppercase: true,
      trim: true,
      required: true,
      unique: true,
    },
    taxPaidOn: {
      type: Date,
      required: true,
    },
    taxPaidUpto: {
      type: Date,
      required: true,
    },
    insurancePaidOn: {
      type: Date,
      required: true,
    },
    insurancePaidUpto: {
      type: Date,
      required: true,
    },
    fitnessPaidOn: {
      type: Date,
      required: true,
    },
    fitnessPaidUpto: {
      type: Date,
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    companyAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
  },
  { timestamps: true }
);

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;

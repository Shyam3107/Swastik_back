export const fileHeader = [
  "Date",
  "DI No.",
  "Billing Rate",
  "Rate",
  "Paid To",
  "Account No.",
  "IFSC",
  "Cash",
  "Diesel",
  "Advance",
  "TDS",
  "Shortage",
  "Other",
  "Remarks",
]

export const modelHeader = [
  "date",
  "diNo",
  "billingRate",
  "rate",
  "paidTo",
  "accountNo",
  "ifsc",
  "cash",
  "diesel",
  "advance",
  "tds",
  "shortage",
  "other",
  "remarks",
]

export const validateArr = [
  "date",
  "diNo",
  "billingRate",
  "rate",
  "paidTo",
  "accountNo",
]

export const aggregateBody = [
  {
    $lookup: {
      from: "trips",
      localField: "diNo",
      foreignField: "diNo",
      as: "trip",
    },
  },
  {
    $unwind: {
      path: "$trip",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "accounts",
      localField: "addedBy",
      foreignField: "_id",
      as: "addedBy",
    },
  },
  {
    $unwind: {
      path: "$addedBy",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $lookup: {
      from: "accounts",
      localField: "trip.addedBy",
      foreignField: "_id",
      as: "trip.addedBy",
    },
  },
  {
    $unwind: {
      path: "$trip.addedBy",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      date: 1,
      accountNo: 1,
      "addedBy._id": 1,
      "addedBy.branch": 1,
      "addedBy.location": 1,
      advance: 1,
      shortage: 1,
      billingRate: 1,
      cash: 1,
      diNo: 1,
      diesel: 1,
      ifsc: 1,
      other: 1,
      paidTo: 1,
      rate: 1,
      remarks: 1,
      tds: 1,
      "trip.lrNo": 1,
      "trip.location": 1,
      "trip.quantity": 1,
      "trip.vehicleNo": 1,
      "trip.date": 1,
      "trip.addedBy.location": 1,
      "trip.addedBy.branch": 1,
    },
  },
]

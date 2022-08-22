import { formatDateInDDMMYYY } from "../../utils/utils.js"

export const fileHeader = [
  "Date",
  "DI No.",
  "Paid To",
  "Account No.",
  "IFSC",
  "Diesel Rate",
  "TDS (%)",
  "Shortage",
  "Other",
  "Remarks",
  "Paid On",
]

export const modelHeader = [
  "date",
  "diNo",
  "paidTo",
  "accountNo",
  "ifsc",
  "dieselRate",
  "tds",
  "shortage",
  "other",
  "remarks",
  "paidOn",
]

export const validateArr = ["date", "diNo", "paidTo", "accountNo"]

export const diSelect =
  "date diNo lrNo vehicleNo quantity addedBy billingRate rate diesel dieselIn location"

export const populateVoucherWithTotal = (val) => {
  // populate the fields inside diNo
  val.billingRate = val?.diNo?.billingRate
  val.rate = val?.diNo?.rate
  val.cash = val?.diNo?.cash ?? 0
  // Calclate Diesel as dieselIn
  val.diesel =
    val?.diNo?.dieselIn === "Litre"
      ? val.diNo.diesel * val?.dieselRate ?? 0
      : val?.diNo?.diesel ?? 0
  val.diDate = val?.diNo?.date
  val.vehicleNo = val?.diNo?.vehicleNo
  val.designation = val?.diNo?.location
  val.lrNo = val?.diNo?.lrNo
  val.quantity = val?.diNo?.quantity
  val.site = val?.diNo?.addedBy?.branch
  val.diNo = val?.diNo?.diNo

  // Calculate the Total amount
  // rate*quantity - cash - diesel - shortage- others
  const initialAmount =
    val.rate * val.quantity - val.cash - val.diesel - val.shortage - val.other

  // Tds will be
  const tds = (initialAmount * val.tds) / 100
  // Total will be
  val.total = initialAmount - tds
  return val
}

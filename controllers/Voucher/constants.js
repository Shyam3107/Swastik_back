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
  val.dieselQty = val?.diNo?.diesel
  val.dieselIn = val?.diNo?.dieselIn
  val.diDate = val?.diNo?.date
  val.vehicleNo = val?.diNo?.vehicleNo
  val.designation = val?.diNo?.location
  val.lrNo = val?.diNo?.lrNo
  val.quantity = val?.diNo?.quantity
  val.site = val?.diNo?.addedBy?.branch
  val.diNo = val?.diNo?.diNo

  // Calculate the Total amount
  // rate*quantity - cash - diesel - shortage- others - (rate*quantity)*tds%
  const freightAmount = val.rate * val.quantity
  // Tds will be
  const tds = (freightAmount * val.tds) / 100
  val.total = Math.round(
    freightAmount - val.cash - val.diesel - val.shortage - val.other - tds
  )

  return val
}

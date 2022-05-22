import { validationResult, body } from "express-validator"
import csv from "csvtojson"
import { join } from "path"
import { unlinkSync } from "fs"

export async function convertCSVToJSON(csvFilePath) {
  let jsonArray = await csv().fromFile(csvFilePath)
  return jsonArray
}

export function handleError(res, errors) {
  if (typeof errors === "string") return res.status(400).json({ errors })
  return res.status(400).json({ errors: errors.message })
}

export function errorValidation(req, res) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    let errArray = errors.array()
    return res.status(400).json({
      errors: errArray.length > 0 ? errArray[0].msg : "Fill Mandatory Fields",
    })
  }
}

export function validateBody(field) {
  return field.map((item) =>
    body(item).not().isEmpty().withMessage(`${item} field is required`)
  )
}

export function validatePhoneNo(phoneNo) {
  const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
  return regex.test(phoneNo)
}

export function removeFile(filePath) {
  unlinkSync(join(filePath))
}

export function userRankQuery(user) {
  if (!user.addedBy) return { companyAdminId: user.companyAdminId }
  else return { addedBy: user._id }
}

export function dateFormat(date) {
  date = date.substr(0, 10)
  const yyyymmdd = /^\d{4}-\d{2}-\d{2}$/
  if (date.match(yyyymmdd)) return "YYYY-MM-DD"
  return "DD-MM-YYYY"
}

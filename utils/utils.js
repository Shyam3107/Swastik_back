import { validationResult, body } from "express-validator"
import csv from "csvtojson"
import { join } from "path"
import { unlinkSync } from "fs"
import moment from "moment"
import momentTimezone from "moment-timezone"

import { access, operations, INDIA_TZ } from "../config/constants.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const convertCSVToJSON = async (csvFilePath) => {
  let jsonArray = await csv().fromFile(csvFilePath)
  return jsonArray
}

export function handleError(res, errors) {
  if (errors.code === 11000) {
    let errMssg = errors?.message
    errMssg = errMssg.split("dup key:")[1]
    if (errMssg) errors = "Duplicate Found : " + errMssg
  }
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

export function parseResponse(data) {
  data = JSON.stringify(data)
  return JSON.parse(data)
}

export const dateToString = (date = moment()) => {
  return moment(date).format("DD-MM-YYYY")
}

export const isAdmin = (user) => {
  return user && user._id === user.companyAdminId._id
}

export const isOperationAllowed = (user, acc, operation = false) => {
  if (isAdmin(user)) return true
  let accessGiven = user?.access.indexOf(acc) !== -1
  let operationGiven = user?.operations.indexOf(operation) !== -1

  if (!operation) {
    return accessGiven || acc === access.DOCUMENTS
  }

  if (acc === access.DOCUMENTS && operation === operations.READ) return true

  return accessGiven && operationGiven
}

export const columnHeaders = (header, key, width = 15) => {
  return { header, key, width }
}

export const formatDateInDDMMYYY = (date = new Date()) => {
  try {
    return moment(date).format("DD-MM-YYYY")
  } catch (error) {
    return "InValid Date"
  }
}

export const validateDateWhileUpload = (value) => {
  if (value?.length < 10) {
    throw `Date should be in DD-MM-YYYY format for row ${ind + 2}`
  }
  value = moment(value, dateFormat(value)).endOf("day").toISOString()
}

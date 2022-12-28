import moment from "moment"
import momentTimezone from "moment-timezone"
import { handleError } from "../../utils/utils.js"
import Trip from "../../models/Trip.js"
import Document from "../../models/Document.js"
import { INDIA_TZ } from "../../config/constants.js"

momentTimezone.tz.setDefault(INDIA_TZ)

export const getHome = async (req, res) => {
  try {
    const companyAdminId = req.user.companyAdminId
    let home = {
      trips: [],
      tax: [],
      insurance: [],
      fitness: [],
      pollution: [],
      permit: [],
      nationalPermit: [],
    }

    for (let index = 0; index < 12; index++) {
      const startDate = moment().month(index).startOf("month")
      const endDate = moment().month(index).endOf("month")

      const temp = await Trip.find({
        companyAdminId,
        date: { $gte: startDate, $lte: endDate },
      }).countDocuments()

      home.trips.push(temp)
    }

    home.tax[0] = await Document.find({
      companyAdminId,
      taxPaidUpto: { $gte: moment() },
    }).countDocuments()

    home.tax[1] = await Document.find({
      companyAdminId,
      taxPaidUpto: { $lt: moment() },
    }).countDocuments()

    home.insurance[0] = await Document.find({
      companyAdminId,
      insurancePaidUpto: { $gte: moment() },
    }).countDocuments()

    home.insurance[1] = await Document.find({
      companyAdminId,
      insurancePaidUpto: { $lt: moment() },
    }).countDocuments()

    home.fitness[0] = await Document.find({
      companyAdminId,
      fitnessPaidUpto: { $gte: moment() },
    }).countDocuments()

    home.fitness[1] = await Document.find({
      companyAdminId,
      fitnessPaidUpto: { $lt: moment() },
    }).countDocuments()

    home.pollution[0] = await Document.find({
      companyAdminId,
      pollutionPaidUpto: { $gte: moment() },
    }).countDocuments()

    home.pollution[1] = await Document.find({
      companyAdminId,
      pollutionPaidUpto: { $lt: moment() },
    }).countDocuments()

    home.permit[0] = await Document.find({
      companyAdminId,
      permitPaidUpto: { $gte: moment() },
    }).countDocuments()

    home.permit[1] = await Document.find({
      companyAdminId,
      permitPaidUpto: { $lt: moment() },
    }).countDocuments()

    home.nationalPermit[0] = await Document.find({
      companyAdminId,
      isNationalPermit: true,
      nationalPermitPaidUpto: { $gte: moment() },
    }).countDocuments()

    home.nationalPermit[1] = await Document.find({
      companyAdminId,
      isNationalPermit: true,
      nationalPermitPaidUpto: { $lt: moment() },
    }).countDocuments()

    return res.status(200).json({ data: home })
  } catch (error) {
    return handleError(res, error)
  }
}

import moment from "moment"
import { handleError } from "../../utils/utils.js"
import Trip from "../../models/Trip.js"
import Document from "../../models/Document.js"

export const getHome = async (req, res) => {
  try {
    const user = req.user
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
        companyAdminId: user.companyAdminId,
        date: { $gte: startDate, $lte: endDate },
      }).countDocuments()

      home.trips.push(temp)
    }

    home.tax[0] = await Document.find({
      companyAdminId: user.companyAdminId,
      taxPaidUpto: { $gte: moment() },
    }).countDocuments()

    home.tax[1] = await Document.find({
      companyAdminId: user.companyAdminId,
      taxPaidUpto: { $lt: moment() },
    }).countDocuments()

    home.insurance[0] = await Document.find({
      companyAdminId: user.companyAdminId,
      insurancePaidUpto: { $gte: moment() },
    }).countDocuments()

    home.insurance[1] = await Document.find({
      companyAdminId: user.companyAdminId,
      insurancePaidUpto: { $lt: moment() },
    }).countDocuments()

    home.fitness[0] = await Document.find({
      companyAdminId: user.companyAdminId,
      fitnessPaidUpto: { $gte: moment() },
    }).countDocuments()

    home.fitness[1] = await Document.find({
      companyAdminId: user.companyAdminId,
      fitnessPaidUpto: { $lt: moment() },
    }).countDocuments()

    home.pollution[0] = await Document.find({
      companyAdminId: user.companyAdminId,
      pollutionPaidUpto: { $gte: moment() },
    }).countDocuments()

    home.pollution[1] = await Document.find({
      companyAdminId: user.companyAdminId,
      pollutionPaidUpto: { $lt: moment() },
    }).countDocuments()

    home.permit[0] = await Document.find({
      companyAdminId: user.companyAdminId,
      permitPaidUpto: { $gte: moment() },
    }).countDocuments()

    home.permit[1] = await Document.find({
      companyAdminId: user.companyAdminId,
      permitPaidUpto: { $lt: moment() },
    }).countDocuments()

    home.nationalPermit[0] = await Document.find({
      companyAdminId: user.companyAdminId,
      nationalPermitPaidUpto: { $gte: moment() },
    }).countDocuments()

    home.nationalPermit[1] = await Document.find({
      companyAdminId: user.companyAdminId,
      nationalPermitPaidUpto: { $lt: moment() },
    }).countDocuments()

    return res.status(200).json({ data: home })
  } catch (error) {
    return handleError(res, error)
  }
}

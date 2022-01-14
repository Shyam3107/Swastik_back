const moment = require("moment");
const { handleError } = require("../../utils/utils");
const Trip = require("../../models/Trip");
const Document = require("../../models/Document");

module.exports.getHome = async (req, res) => {
  try {
    const user = req.user;
    let home = { trips: [], tax: [], insurance: [], fitness: [] };
    let temp;

    for (let index = 0; index < 12; index++) {
      const startDate = moment().month(index).startOf("month");
      const endDate = moment().month(index).endOf("month");

      const temp = await Trip.find({
        companyAdminId: user.companyAdminId,
        date: { $gte: startDate, $lte: endDate },
      }).countDocuments();

      home.trips.push(temp);
    }

    home.tax[0] = await Document.find({
      companyAdminId: user.companyAdminId,
      taxPaidUpto: { $gte: moment() },
    }).countDocuments();

    home.tax[1] = await Document.find({
      companyAdminId: user.companyAdminId,
      taxPaidUpto: { $lt: moment() },
    }).countDocuments();

    home.insurance[0] = await Document.find({
      companyAdminId: user.companyAdminId,
      insurancePaidUpto: { $gte: moment() },
    }).countDocuments();

    home.insurance[1] = await Document.find({
      companyAdminId: user.companyAdminId,
      insurancePaidUpto: { $lt: moment() },
    }).countDocuments();

    home.fitness[0] = await Document.find({
      companyAdminId: user.companyAdminId,
      insurancePaidUpto: { $gte: moment() },
    }).countDocuments();

    home.fitness[1] = await Document.find({
      companyAdminId: user.companyAdminId,
      fitnessPaidUpto: { $lt: moment() },
    }).countDocuments();

    return res.status(200).json({ data: home });
  } catch (error) {
    return handleError(res, error);
  }
};

import jsonwebtoken from "jsonwebtoken";
import moment from "moment";
import { methods } from "../config/constants.js";
import {
  handleError,
  isAdmin,
  isOperationAllowed,
  parseResponse,
} from "../utils/utils.js";
import Account from "../models/Account.js";
import Receipt from "../models/Receipt.js";
import OfficeExpense from "../models/OfficeExpense.js";
import VehiclesExpense from "../models/VehiclesExpense.js";
import Trip from "../models/Trip.js";
const { verify } = jsonwebtoken;

export const checkUser = (accessType = false) => {
  return (req, res, next) => {
    try {
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        req.user = verify(token, process.env.JWT_SECRET_KEY);

        // MORE GENERIC, USER CAN EDIT HIS OWN ACCOUNT
        // if (
        //   accessType &&
        //   req.method != "GET" &&
        //   !isOperationAllowed(req.user, accessType, methods[req.method])
        // ) {
        //   return res
        //     .status(500)
        //     .json({ errors: "You don't have permission for this" })
        // }

        // Handle From and To value in Middleware itself
        let { from = moment().startOf("month"), to = moment() } = req.query;
        req.query.from = moment(from).startOf("day").toISOString();
        req.query.to = moment(to).endOf("day").toISOString();

        if (moment(req.query.from).isAfter(req.query.to)) {
          return res
            .status(400)
            .json({ errors: "From Date should be Before To Date" });
        }

        console.log("User : ", req.user.location);
        console.log("Request Query : ", req.query);

        return next();
      }
      throw new Error();
    } catch (err) {
      return res.status(401).json({ errors: "UnAuthorized Request" });
    }
  };
};

export const checkForPastDataAdditon = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // User can't change the Past data
      // alag alag krnna hai , in case of date change , new date ko le rha hai
      if (!isAdmin(user)) {
        let lastEntryCheckedOn = await getUserLastCheckedOn(user);

        if (moment(req.body.date).isSameOrBefore(lastEntryCheckedOn))
          throw "You Can not make changes in Past entries";
      }

      return next();
    } catch (err) {
      return handleError(res, err);
    }
  };
};

export const checkForPastDataModifications = (access) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // User can't change the Past data
      // alag alag krnna hai , in case of date change , new date ko le rha hai
      if (!isAdmin(user)) {
        let lastEntryCheckedOn = await getUserLastCheckedOn(user);

        let oldDate;

        const accessId = req.body._id;

        switch (access) {
          case "RECEIPT":
            oldDate = await Receipt.findById({ _id: accessId }).select({
              date: 1,
            });
            break;

          case "OFFICE EXPENSE":
            oldDate = await OfficeExpense.findById({ _id: accessId }).select({
              date: 1,
            });
            break;

          case "VEHICLE EXPENSE":
            oldDate = await VehiclesExpense.findById({ _id: accessId }).select({
              date: 1,
            });
            break;

          case "TRIP":
            oldDate = await Trip.findById({ _id: accessId }).select({
              date: 1,
            });
            break;

          default:
            return next();
        }

        if (
          moment(parseResponse(oldDate).date).isSameOrBefore(
            lastEntryCheckedOn
          ) ||
          moment(req.body.date).isSameOrBefore(lastEntryCheckedOn)
        )
          throw "You Can not make changes in Past entries";
      }

      return next();
    } catch (err) {
      return handleError(res, err);
    }
  };
};

export const checkForPastDataDeletions = (access) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // User can't change the Past data
      // alag alag krnna hai , in case of date change , new date ko le rha hai
      if (!isAdmin(user)) {
        let lastEntryCheckedOn = await getUserLastCheckedOn(user);
        lastEntryCheckedOn = moment(lastEntryCheckedOn).endOf("day");

        let oldData;

        const accessId = req.body;

        switch (access) {
          case "RECEIPT":
            oldData = await Receipt.find({
              _id: { $in: accessId },
              date: { $lte: lastEntryCheckedOn },
            }).select({
              date: 1,
            });
            break;

          case "OFFICE EXPENSE":
            oldData = await OfficeExpense.find({
              _id: { $in: accessId },
              date: { $lte: lastEntryCheckedOn },
            }).select({
              date: 1,
            });
            break;

          case "VEHICLE EXPENSE":
            oldData = await VehiclesExpense.find({
              _id: { $in: accessId },
              date: { $lte: lastEntryCheckedOn },
            }).select({
              date: 1,
            });
            break;

          case "TRIP":
            oldData = await Trip.find({
              _id: { $in: accessId },
              date: { $lte: lastEntryCheckedOn },
            }).select({
              date: 1,
            });
            break;

          default:
            return next();
        }

        if (oldData && oldData?.length) throw "You Can not Delete Past entries";
      }

      return next();
    } catch (err) {
      return handleError(res, err);
    }
  };
};

export const getUserLastCheckedOn = async (user) => {
  let lastEntryCheckedOn = await Account.findOne({
    _id: user._id,
  }).select({ entriesLastChecked: 1 });

  return moment(parseResponse(lastEntryCheckedOn).entriesLastChecked);
};

export const lastEntryCheckedOnDate = async (user) => {
  let lastEntryCheckedOn = await Account.findOne({
    _id: user._id,
  }).select({ entriesLastChecked: 1 });

  return moment(parseResponse(lastEntryCheckedOn).entriesLastChecked);
};

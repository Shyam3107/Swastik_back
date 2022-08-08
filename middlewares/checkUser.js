import jsonwebtoken from "jsonwebtoken"
import moment from "moment"
import { methods } from "../config/constants.js"
import { isOperationAllowed } from "../utils/utils.js"
const { verify } = jsonwebtoken

export const checkUser = (accessType = false) => {
  return (req, res, next) => {
    try {
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1]
        req.user = verify(token, process.env.JWT_SECRET_KEY)
        if (
          accessType &&
          req.method != "GET" &&
          !isOperationAllowed(req.user, accessType, methods[req.method])
        ) {
          return res
            .status(500)
            .json({ errors: "You don't have permission for this" })
        }

        // Handle From and To value in Middleware itself
        let { from = moment().startOf("month"), to = moment() } = req.query
        req.query.from = moment(from).startOf("day").toISOString()
        req.query.to = moment(to).endOf("day").toISOString()

        return next()
      }
      throw new Error()
    } catch (err) {
      return res.status(401).json({ errors: "UnAuthorized Request" })
    }
  }
}

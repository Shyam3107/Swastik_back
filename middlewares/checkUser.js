var jwt = require("jsonwebtoken");

module.exports.checkUser = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
      return next();
    }
    throw new Error();
  } catch (err) {
    return res.status(401).json({ error: "UnAuthorized Request" });
  }
};
const jwt = require("jsonwebtoken");
const md5 = require("md5");
const dotenv = require("dotenv");
const { handleError } = require("../../utils/utils");
const Account = require("../../models/Account");
dotenv.config();

module.exports.login = async (req, res) => {
  try {
    const userName = req.query.userName;
    const password = req.query.password;
    const encryptPassword = md5(password);

    let user = await Account.findOne({ userName, password: encryptPassword });

    if (!user)
      return res.status(400).json({ error: "User or Password is Incorrect" });

    user = JSON.stringify(user);
    user = JSON.parse(user);

    const token = jwt.sign(user, process.env.JWT_SECRET_KEY);

    delete user.password;

    return res.status(200).json({ user, token, message: "Login Successful" });
  } catch (error) {
    return handleError(res, error);
  }
};

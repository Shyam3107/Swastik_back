const jwt = require("jsonwebtoken");
const md5 = require("md5");
const dotenv = require("dotenv");
const Student = require("../models/student");
const { handleError } = require("../../utils/utils");
dotenv.config();

const admin={
  email:process.env.ADMIN_EMAIL,
  password=md5(process.env.ADMIN_PASSWORD),
  userType:"ADMIN",
}

module.exports.login = async (req, res) => {
  try {
    const userName = req.query.userName;
    const password = req.query.password;
    const encryptPassword = md5(password);

    let user;
    if(userName===admin.email && encryptPassword===admin.password) user=admin;
    user = JSON.stringify(user);
    user = JSON.parse(user);

    if (!user)
      return res.status(400).json({ error: "User or Password is Incorrect" });

    const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {
      //expiresIn: "24h",
    });

    return res.status(200).json({ user, token });
  } catch (error) {
    return handleError(res, error);
  }
};

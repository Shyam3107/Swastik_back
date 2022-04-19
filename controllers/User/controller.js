const jwt = require("jsonwebtoken")
const md5 = require("md5")
const dotenv = require("dotenv")
const { handleError } = require("../../utils/utils")
const Account = require("../../models/Account")
dotenv.config()

const secretKey = "Singhania"

module.exports.login = async (req, res) => {
  try {
    let userName = req.query.userName
    const password = req.query.password
    if (!userName || !password) throw "Username and Password is Required"
    const encryptPassword = md5(password)

    if (userName) userName = userName.toLowerCase()

    let user = await Account.findOne({
      userName,
      password: encryptPassword,
    })
      .select({
        password: 0,
      })
      .populate({ path: "companyAdminId", select: "companyName tptCode" })

    if (!user) throw "User or Password is Incorrect"

    user = JSON.stringify(user)
    user = JSON.parse(user)

    const token = jwt.sign(user, process.env.JWT_SECRET_KEY)

    return res.status(200).json({ user, token, message: "Login Successful" })
  } catch (error) {
    return handleError(res, error)
  }
}

module.exports.forgotPassword = async (req, res) => {
  try {
    let userName = req.query.userName
    const password = req.query.password
    const userSecretKey = req.query.secretKey
    const encryptPassword = md5(password)

    if (userSecretKey !== secretKey) throw "Incorrect Secret Key"

    if (userName) userName = userName.toLowerCase()

    let user = await Account.findOne({ userName })

    if (!user) throw "User Name does not exist in our Record"

    const updateUserPassword = await Account.findOneAndUpdate(
      { userName },
      { password: encryptPassword }
    )

    if (!updateUserPassword) throw "Failed to Reset, Please Try Again !"

    return res.status(200).json({ message: "Password Reset Success" })
  } catch (error) {
    return handleError(res, error)
  }
}

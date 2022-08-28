import express from "express"
const app = express()
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import bodyParser from "body-parser"

import { checkUser } from "./middlewares/checkUser.js"
import tripRoute from "./controllers/Trips/route.js"
import documentRoute from "./controllers/Documents/route.js"
import accountRoute from "./controllers/Account/route.js"
import officeExpenseRoute from "./controllers/OfficeExpense/route.js"
import vehiclesExpenseRoute from "./controllers/VehicleExpense/route.js"
import receiptRoute from "./controllers/Receipts/route.js"
import userRoute from "./controllers/User/route.js"
import reportRoute from "./controllers/Reports/route.js"
import voucherRoute from "./controllers/Voucher/route.js"
import pumpDieselRoute from "./controllers/PumpDiesel/route.js"
import productRoute from "./controllers/Product/route.js"
import logisticRoute from "./controllers/Logistics/route.js"
import vehicleOwnerRoute from "./controllers/VehicleOwner/route.js"
import hardwareShopBillRoute from "./controllers/HardwareShopBill/route.js"
import { getHome } from "./controllers/Home/controller.js"
import { access, PORT } from "./config/constants.js"
import httpCallLogger from "./middlewares/httpCallLogger.js"

app.use(cors())
///app.use(express.json())
app.use(bodyParser.json({ limit: "50mb" }))
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
)
app.use(httpCallLogger)
dotenv.config()

app.listen(process.env.PORT || PORT, () => {
  console.log("Application Started in Port " + PORT)
})

const dbURI = process.env.MONGODB_URL

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("Database Connected")
  })
  .catch((err) => console.log(err))

app.get("/", async (req, res) => {
  return res.status(200).json({ data: "App started" })
})

// USERS
app.use("/user", userRoute)

// HOME
app.get("/home", checkUser(), getHome)

// VEHICLES
app.use("/vehicles/trips", checkUser(), tripRoute)
app.use("/vehicles/documents", checkUser(), documentRoute)
app.use("/vehicles/vouchers", checkUser(), voucherRoute)

// EXPENSES
app.use("/expenses/office", checkUser(), officeExpenseRoute)
app.use("/expenses/vehicles", checkUser(), vehiclesExpenseRoute)

// RECEIPTS
app.use("/receipts", checkUser(), receiptRoute)

// CONFIGURATION
app.use("/configure/accounts", checkUser(access.ACCOUNTS), accountRoute)

// REPORTS
app.use("/reports", checkUser(), reportRoute)

// STORE
app.use("/store/product", checkUser(), productRoute)
app.use("/store/logistic", checkUser(), logisticRoute)
app.use("/store/hardwareshops", checkUser(), hardwareShopBillRoute)

// DIESELS
app.use("/diesels/vehicles", checkUser(), vehicleOwnerRoute)
app.use("/diesels/pumpDiesel", checkUser(), pumpDieselRoute)

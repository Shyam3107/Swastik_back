import express from "express"
const app = express()
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"

import { checkUser } from "./middlewares/checkUser.js"
import tripRoute from "./controllers/Trips/route.js"
import documentRoute from "./controllers/Documents/route.js"
import accountRoute from "./controllers/Account/route.js"
import officeExpenseRoute from "./controllers/OfficeExpense/route.js"
import vehiclesExpenseRoute from "./controllers/VehicleExpense/route.js"
import receiptRoute from "./controllers/Receipts/route.js"
import userRoute from "./controllers/User/route.js"
import { getHome } from "./controllers/Home/controller.js"
import { PORT } from "./config/constants.js"
import httpCallLogger from "./middlewares/httpCallLogger.js"

app.use(cors())
app.use(express.json())
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
app.get("/home", checkUser, getHome)

// VEHICLES
app.use("/vehicles/trips", checkUser, tripRoute)
app.use("/vehicles/documents", checkUser, documentRoute)

// EXPENSES
app.use("/expenses/office", checkUser, officeExpenseRoute)
app.use("/expenses/vehicles", checkUser, vehiclesExpenseRoute)

// RECEIPTS
app.use("/receipts", checkUser, receiptRoute)

// CONFIGURATION
app.use("/configure/accounts", checkUser, accountRoute)

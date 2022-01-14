const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const { checkUser } = require("./middlewares/checkUser");
const tripRoute = require("./controllers/Trips/route");
const documentRoute = require("./controllers/Documents/route");
const accountRoute = require("./controllers/Account/route");
const officeExpenseRoute = require("./controllers/OfficeExpense/route");
const vehiclesExpenseRoute = require("./controllers/VehicleExpense/route");
const receiptRoute = require("./controllers/Receipts/route");
const userRoute = require("./controllers/User/route");

const { getHome } = require("./controllers/Home/controller");

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static("public"));
dotenv.config();

const { PORT } = require("./config/constants");

app.listen(process.env.PORT || PORT, () => {
  console.log("Application Started in Port " + PORT);
});

const dbURI = process.env.MONGODB_URL;

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("Database Connected");
  })
  .catch((err) => console.log(err));

app.get("/", async (req, res) => {
  return res.status(200).json({ data: "App started" });
});

// USERS
app.use("/user", userRoute);

// HOME
app.get("/home", checkUser, getHome);

// VEHICLES
app.use("/vehicles/trips", checkUser, tripRoute);
app.use("/vehicles/documents", checkUser, documentRoute);

// EXPENSES
app.use("/expenses/office", checkUser, officeExpenseRoute);
app.use("/expenses/vehicles", checkUser, vehiclesExpenseRoute);

// RECEIPTS
app.use("/receipts", checkUser, receiptRoute);

// CONFIGURATION
app.use("/configure/accounts", checkUser, accountRoute);

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const { checkUser } = require("./middlewares/checkUser");
const { login } = require("./controllers/Login/login");
const tripRoute = require("./controllers/Trips/route");

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static("public"));
dotenv.config();

const { PORT } = require("./config/constants");

app.listen(PORT, () => {
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

app.get("/login", login);
app.use("/vehicles/trips", checkUser, tripRoute);

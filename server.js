const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const { Vehicle, PettyCashbook } = require("./database");
const { addBalance, Compose, editData, addPlace } = require('./postDB');

app.use(cors());
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.json('App is Working');
})

app.get("/Vehicle", function (req, res) { // send all unique vehicle 
    Vehicle.distinct("Vehicle", function (err, detail) {
        if (err) res.status(400).json('Failed to Fetch');
        res.json(detail);
    });
})

app.get("/Place", function (req, res) { //send all unique place
    PettyCashbook.distinct("Place", function (err, data) {
        if (err) res.status(400).json('Failed to Fetch');
        res.json(data);
    })
})

app.get("/Transactions", function (req, res) { // send particular vehicle details
    Vehicle.find(function (err, detail) {
        if (err) res.status(400).json('Failed to Fetch');
        res.json(detail);
    })
})

app.get("/Vehicle/:num", function (req, res) { // send particular vehicle details
    const num = req.params.num;
    Vehicle.find({ "Vehicle": num }, function (err, detail) {
        if (err) res.status(400).json('Failed to Fetch');
        res.json(detail);
    })
})

app.get("/Place/:place", function (req, res) { // send particular place details
    const place = req.params.place;
    var detail = {};
    Vehicle.find({ 'Place': place }, function (err, data) {
        if (err) res.status(400).json('Failed to Fetch');
        PettyCashbook.find({ 'Place': place }, function (err, data2) {
            if (err) res.status(400).json('Failed to Fetch');
            detail.Balance = data2[0].Balance;
            detail.detail = data;
            res.json(detail);
        })
    })
})

app.post("/Compose", Compose) // post vehciles data  

app.post("/addBalance", addBalance) // add balance to corresponding place

app.post("/editData", editData) // add diesel price and other details

app.post('/addPlace',addPlace) // add new Place with opening balance

app.listen(process.env.PORT || 5000, function () {
    console.log("Server started in port 5000");
})
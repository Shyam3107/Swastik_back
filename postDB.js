const { Vehicle, PettyCashbook } = require("./database");

const err_mssg = "Failed to Add";
const succ_mssg = "Successfully Added";

const addBalance = (req, res) => {
    var place = req.body.Place;
    req.body.Date = new Date(req.body.Date);
    new Vehicle(req.body).save(function (err) { // store as new data
        if (err) res.status(400).json(err_mssg);
    });
    PettyCashbook.findOne({ 'Place': place }, function (err, found) { // updat the balance of corresponding place
        if (err || found === null) res.status(400).json(err_mssg);
        else {
            found.Balance += req.body.Debit;
            found.save(function (err) {
                if (err) res.status(400).json(err_mssg);
            });
            res.json(succ_mssg);
        }
    })
}

const Compose = (req, res) => {

    req.body.Date = new Date(req.body.Date); // to store date in DATE type

    new Vehicle(req.body).save(function (err) { // save in Vehicle as new data
        if (err) res.status(400).json(err_mssg);
    });

    if (req.body.Expenses !== 0) {
        PettyCashbook.findOne({ 'Place': req.body.Place }, function (err, found) { // if expenses then update current from where it is received
            if (err) res.status(400).json(err_mssg);
            else if (found === null) { // if place does not exist create one
                new PettyCashbook({
                    Place: req.body.Place,
                    Balance: -req.body.Expenses
                }).save(function (err) {
                    if (err) res.status(400).json(err_mssg);
                });
            }
            else { // if exist update it
                found.Balance -= req.body.Expenses;
                found.save(function (err) {
                    if (err) res.status(400).json(err_mssg);
                });
            }
        })
    }
    res.json(succ_mssg);
}

const editData = (req, res) => { // data is any object with key a id and value as new diesel price
    var data = req.body;
    function addData(Dkey, Dvalue) {
        Vehicle.findOne({ '_id': Dkey }, function (err, found) {
            if (err) res.status(400).json(err_mssg);
            found.DieselPrice = Dvalue;
            found.DieselCost = (found.DieselPrice * found.Diesel).toFixed(2);
            found.Balance = (found.RateCost - found.DieselCost - found.Expenses).toFixed(2);
            console.log(Dkey);
            found.save(function (err) {
                if (err); res.status(400).json(err_mssg);
            })
        })
    }
    for (var key in data) {
        addData(key, data[key]);
    }
    res.json(succ_mssg); // think how to handle Vehicle first then send mssg
}

const addPlace = (req, res) => {
    var data = req.body;
    PettyCashbook.findOne({ 'Place': data.Place }, function (err, found) { 
        if (err) res.status(400).json(err_mssg);
        else if(found) res.json("Place already exist, update the Balance there");
        else {
            new Vehicle(data).save(function(err){
                if(err) res.status(400).json(err_mssg);
            })
            data.Balance=data.Debit;
            new PettyCashbook(data).save(function(err){
                if(err) res.status(400).json(err_mssg);
            })
            res.json(succ_mssg);
        }
    })
}

module.exports = { addBalance, Compose, editData, addPlace };
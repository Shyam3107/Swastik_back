const express=require("express");
const app=express();
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const cors=require("cors");
const cron=require('node-cron');

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());

mongoose.connect("mongodb://localhost:27017/VehicleDB",{ useNewUrlParser:true,useUnifiedTopology:true});

const vehicleSchema=new mongoose.Schema({
    Date:{
        type:Number,
        default: new Date().getDate()
    },
    Month:{
        type:Number,
        default: new Date().getMonth()+1
    },
    Year: {
        type:Number,
        default: new Date().getFullYear()
    },
    Vehicle : String,
    DIno : Number,
    Place: String,
    Qty: Number,
    Rate: Number,
    RateCost: Number,
    Diesel: Number,
    DieselPrice: Number,
    DieselCost:Number,
    Balance: Number,
    Expenses: Number,
    Remarks: String
})

const PlaceVehSchema= new mongoose.Schema({
    Date:{
        type:Number,
        default: new Date().getDate()
    },
    Month:{
        type:Number,
        default: new Date().getMonth()+1
    },
    Year: {
        type:Number,
        default: new Date().getFullYear()
    },
    Vehicle : String,
    Credit: Number,
    Debit : Number,
    Remarks : String
})

const placeSchema=new mongoose.Schema({
    Place: String,
    Balance : {
        Current :{
            type: Number,
            default : 0
        },
        Daily:[{
            Date:{
                type:Number,
                default: new Date().getDate()
            },
            Month:{
                type:Number,
                default: new Date().getMonth()
            },
            Year:{
                type:Number,
                default: new Date().getFullYear()
            },
            Open: Number,
            Close: Number
        }]
    },
    Payment : [PlaceVehSchema]
})

const Vmodel=mongoose.model("Vehicle",vehicleSchema); // model for Vehicle Details
const PVmodel= mongoose.model("PlaceVeh",PlaceVehSchema); // model for vehicle took payment from place
const Pmodel=mongoose.model("Place",placeSchema); // model for Place Details

cron.schedule("0 0 0 * * *", function(x) { // to update opening and closing balance everyday
Pmodel.find(function(err,found){
    found.map(function(data){
        var bal={
            Open:data.Balance.Current,
            Close:data.Balance.Current
        };
        data.Balance.Daily.push(bal);
        data.save();
    })
})
});

app.get("/Vehicle",function(req,res){ // send all unique vehicle 
    Vmodel.distinct("Vehicle",function(err,detail){
        res.send(detail);
    });
})

app.get("/Place",function(req,res){ //send all unique place
    Pmodel.distinct("Place",function(err,data){
        res.send(data);
    })
})

app.get("/vehicle/:num",function(req,res){ // send particular vehicle details
    const num=req.params.num;
    Vmodel.find({"Vehicle":num},function(err,detail){
        if(err){} // think what to do
        res.send(detail);
    })
})

app.get("/place/:place",function(req,res){
    const place=req.params.place;
    Pmodel.find({'Place':place},function(err,data){
        if(err){} // think what to do
        res.send(data);
    })
})

app.post("/ComposeVehicle",function(req,res){ // post details of per vehicle loaded
    const data=new Vmodel(req.body);
    data.save(function(err){
        if(err){
            res.send(false);
        }
        else {
            res.send(true);
        }
    });
})

app.post("/ComposePlace",function(req,res){ // post deatils of payment from diff places
    const detail =new Vmodel(req.body.detail); // save vehicle detail to vehicle section
    detail.Place=req.body.place;
    detail.Expenses=req.body.detail.Credit;
    detail.save();
    const data=new PVmodel(req.body.detail); // body is an object with key place and detail
    Pmodel.find({'Place': req.body.place},function(err,found){
        if(err) {}; // think what to do
        if(found.length==0){ // not exist then create one
            var info= new Pmodel({
                Place: req.body.place,
                Balance: {
                    Current: -data.Credit,
                    Daily:[{
                        Close:-data.Credit,
                        Open:0
                    }]
                },
                Payment : [data]
            })
            info.save(function(err){
                if(err) res.send(false);
                else res.send(true);
            })
        }
        else{ // if exist then push the detail
            found[0].Payment.push(data);
            found[0].Balance.Current-=data.Credit; // deduct credit from current
            var len=found[0].Balance.Daily.length;
            found[0].Balance.Daily[len-1].Close-=data.Credit;
            found[0].save(function(err){
                if(err) res.send(false);
                else res.send(true);
            })
        }
    })
})

app.post("/addBalance",function(req,res){ // add balance to place
    var place=req.body.place;
    var bal=req.body.balance;
    Pmodel.find({'Place':place},function(err,found){
        found[0].Balance.Current+=bal; // update the current balance
        var len=found[0].Balance.Daily.length;
        found[0].Balance.Daily[len-1].Close+=bal; // update the closing balance
        var data =new PVmodel({
            Debit:bal,
            Remarks:'Cash Received'
        });
        found[0].Payment.push(data); // add balance details
        found[0].save(function(err){
            if(err) res.send(false);
            else res.send(true);
        });
    });
})

app.listen(5000,function(){
    console.log("Server started in port 5000"); 
})
const express = require("express");
const app=express();
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const cors=require("cors");

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI,{ useNewUrlParser:true,useUnifiedTopology:true});
//mongoose.connect('mongodb+srv://dbSwastik:SwastikDB@swastikdb.rinnm.mongodb.net/dbSwastik?retryWrites=true',{ useNewUrlParser:true,useUnifiedTopology:true});

//mongoose.connect("mongodb://localhost:27017/SwastikDB",{ useNewUrlParser:true,useUnifiedTopology:true});

const vehicles=new mongoose.Schema({
    Date: {
        type:Number,
        default:new Date().getDate()
    },
    Month:{
        type:Number,
        default:new Date().getMonth()+1
    },
    Year: {
        type:Number,
        default:new Date().getFullYear()
    },
    Vehicle : String,
    From :String,
    To :String,
    DIno : Number,
    Qty: Number,
    Rate: Number,
    RateCost: Number,
    Diesel: Number,
    DieselPrice: Number,
    DieselCost:Number,
    Balance: Number,
    Expenses: Number,
    Place:String,
    Remarks: String,
    Debit:Number // specific for petty cashbook
})

const pettyCashbooks=new mongoose.Schema({
    Place:String,
    Balance:Number
})

const Vehicle=mongoose.model("Vehicle",vehicles);
const PettyCashbook=mongoose.model("PettyCashbook",pettyCashbooks);

app.get('/',function(req,res){
    res.send('App is Working');
})

app.get("/Vehicle",function(req,res){ // send all unique vehicle 
    Vehicle.distinct("Vehicle",function(err,detail){
        if(err){
            res.status(404).send(false);
        }
        res.send(detail);
    });
})

app.get("/Place",function(req,res){ //send all unique place
    PettyCashbook.distinct("Place",function(err,data){
        if(err){
            res.send(false);
        }
        res.send(data);
    })
})

app.get("/Transactions",function(req,res){ // send particular vehicle details
    Vehicle.find(function(err,detail){
        if(err){
            res.send(false);
        }
        res.send(detail);
    })
})

app.get("/Vehicle/:num",function(req,res){ // send particular vehicle details
    const num=req.params.num;
    Vehicle.find({"Vehicle":num},function(err,detail){
        if(err){
            res.send(false);
        }
        res.send(detail);
    })
})

app.get("/Place/:place",function(req,res){ // send particular place details
    const place=req.params.place;
    var detail={};
    Vehicle.find({'Place':place},function(err,data){
        if(err){
            res.send(false);
        }
        PettyCashbook.find({'Place':place},function(err,data2){
            if(err){
                res.send(false);
            }
            detail.Balance=data2[0].Balance;
            detail.detail=data;
            res.send(detail);
        })
    })
})

app.post("/Compose",function(req,res){ // post vehciles data  
    new Vehicle(req.body).save(function(err){
        if(err) res.send(false);
    });
    if(req.body.Expenses!==0){
        PettyCashbook.find({'Place':req.body.Place},function(err,found){ // if expenses then update current from where it is received
            if(err) res.send(false);
            else if(found.length===0){
                new PettyCashbook({
                    Place:req.body.Place,
                    Balance :-req.body.Expenses
                }).save(function(err){
                    if(err) res.send(false);
                });
            }
            else{
                found[0].Balance-=req.body.Expenses;
                found[0].save(function(err){
                    if(err) res.send(false);
                });
            }
            res.send(true);
        })
    };
})

app.post("/addBalance",function(req,res){ // add balance to corresponding place
    var place=req.body.Place;
    new Vehicle(req.body).save(function(err){
        if(err) res.send(false);
    });
    PettyCashbook.find({'Place':place},function(err,found){
        if(err) res.send(false);
        if(found.length===0) res.send(false);
        found[0].Balance+=req.body.Debit;
        found[0].save(function(err){
            if(err) res.send(false);
        });
        res.send(true);
    })
})

app.put("/editData",function(req,res){ // add diesel price and other details
    var data=req.body;
    function addData(Dkey,Dvalue){ 
        Vehicle.find({'_id':Dkey},function(err,found){
            if(err) res.send(false);
            found[0].DieselPrice=Dvalue;
            found[0].DieselCost=found[0].DieselPrice * found[0].Diesel;
            found[0].Balance=found[0].RateCost-found[0].DieselCost-found[0].Expenses;
            found[0].save(function(err){
                if(err) res.send(false);
            })
        })
    }
    for(var key in data){
        addData(key,data[key]);
    }
    res.send(true);
})

app.listen(process.env.PORT||5000,function(){
    console.log("Server started in port 5000"); 
})
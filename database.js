const mongoose=require("mongoose");

mongoose.connect(process.env.MONGODB_URI,{ useNewUrlParser:true,useUnifiedTopology:true});
//mongoose.connect('mongodb+srv://dbSwastik:SwastikDB@swastikdb.rinnm.mongodb.net/dbSwastik?retryWrites=true',{ useNewUrlParser:true,useUnifiedTopology:true});

//mongoose.connect("mongodb://localhost:27017/SwastikDB",{ useNewUrlParser:true,useUnifiedTopology:true});

const vehicles=new mongoose.Schema({
    Date: Date,
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

module.exports= {Vehicle,PettyCashbook};
const {Vehicle,PettyCashbook}=require("./database");

const err_mssg="Failed to Add";
const succ_mssg="Successfully Added";

const addBalance=(req,res)=>{
    var place=req.body.Place;
    new Vehicle(req.body).save(function(err){
        if(err) res.status(400).json(err_mssg);
    });
    PettyCashbook.find({'Place':place},function(err,found){
        if(err) res.status(400).json(err_mssg);
        if(found.length===0) res.json(false);
        found[0].Balance+=req.body.Debit;
        found[0].save(function(err){
            if(err) res.status(400).json(err_mssg);
        });
        res.json(succ_mssg);
    })
}

const Compose=(req,res)=>{
    new Vehicle(req.body).save(function(err){
        if(err) res.status(400).json(err_mssg);
    });
    if(req.body.Expenses!==0){
        PettyCashbook.find({'Place':req.body.Place},function(err,found){ // if expenses then update current from where it is received
            if(err) res.status(400).json(err_mssg);
            else if(found.length===0){
                new PettyCashbook({
                    Place:req.body.Place,
                    Balance :-req.body.Expenses
                }).save(function(err){
                    if(err) res.status(400).json(err_mssg);
                });
            }
            else{
                found[0].Balance-=req.body.Expenses;
                found[0].save(function(err){
                    if(err) res.status(400).json(err_mssg);
                });
            }
            res.json(succ_mssg);
        })
    }
    else res.json(succ_mssg);
}

const editData=(req,res)=>{
    var data=req.body;
    function addData(Dkey,Dvalue){ 
        Vehicle.findOne({'_id':Dkey},function(err,found){
            if(err) res.status(400).json(err_mssg);
            found.DieselPrice=Dvalue;
            found.DieselCost=found.DieselPrice * found.Diesel;
            found.Balance=found.RateCost-found.DieselCost-found.Expenses;
            found.save(function(err){
                if(err) res.status(400).json(succ_mssg);
            })
        })
    }
    for(var key in data){
        addData(key,data[key]);
    }
    res.json(succ_mssg);
}

module.exports={addBalance,Compose,editData};
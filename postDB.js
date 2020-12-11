const {Vehicle,PettyCashbook}=require("./database");

const err_mssg="Failed to Add";
const succ_mssg="Successfully Added";

const addBalance=(req,res)=>{
    var place=req.body.Place;
    new Vehicle(req.body).save(function(err){
        if(err) res.status(400).json(err_mssg);
    });
    PettyCashbook.findOne({'Place':place},function(err,found){
        if(err) res.status(400).json(err_mssg);
        else if(found===null) res.json(err_mssg);
        else{
            found.Balance+=req.body.Debit;
            found.save(function(err){
            if(err) res.status(400).json(err_mssg);
        });
        res.json(succ_mssg);
    }
    })
}

const Compose=(req,res)=>{
    new Vehicle(req.body).save(function(err){
        if(err) res.status(400).json(err_mssg);
    });
    if(req.body.Expenses!==0){
        PettyCashbook.findOne({'Place':req.body.Place},function(err,found){ // if expenses then update current from where it is received
            if(err) res.status(400).json(err_mssg);
            else if(found===null){
                new PettyCashbook({
                    Place:req.body.Place,
                    Balance :-req.body.Expenses
                }).save(function(err){
                    if(err) res.status(400).json(err_mssg);
                });
            }
            else{
                found.Balance-=req.body.Expenses;
                found.save(function(err){
                    if(err) res.status(400).json(err_mssg);
                });
            }
            res.json(succ_mssg);
        })
    }
    else res.json(succ_mssg);
}

const editData= (req,res)=>{ // data is any object with key a id and value as new diesel price
    var data=req.body;
     function addData(Dkey,Dvalue){ 
         Vehicle.findOne({'_id':Dkey},function(err,found){
            if(err); //
            found.DieselPrice=Dvalue;
            found.DieselCost=(found.DieselPrice * found.Diesel).toFixed(2);
            found.Balance=(found.RateCost-found.DieselCost-found.Expenses).toFixed(2);
            console.log(Dkey);
            found.save(function(err){
                if(err); // think of error handling
            })
            return 1;
        })
    }
    for(var key in data){
        addData(key,data[key]);
    }
    res.json(succ_mssg); // think how to handle Vehicle first then send mssg
}

module.exports={addBalance,Compose,editData};
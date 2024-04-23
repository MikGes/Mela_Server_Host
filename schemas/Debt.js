const mongoose = require("mongoose");
const DebtSchema = new mongoose.Schema({
    customer_Info:{
        name:{
            type:String
        },
        email:{
            type:String
        },
        customer_id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"customer",
        },

    },
    serviceId:{
        type:String
    },
    provider_Info:{
        name:{
            type:String
        },
        email:{
            type:String
        },
        provider_id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"provider",
        },
    },
    commission:{
        type:Number
    },  
    date:{
        type:Date,
        default:Date.now
    },
    paid:{
        type:Boolean,
        default:false
        
    }
})
module.exports = mongoose.model("debt",DebtSchema)
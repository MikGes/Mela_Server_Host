const mongoose = require("mongoose");
const customerSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please enter a name"],
    },
    password:{
        type:String,
        // required:[true,"Please enter a password"],
        default:""
    },
    email:{
        type:String,
        // required:[true,"Please enter an email"],
        default:""
    },
    km:{
        type:Number,
        default:null,
    },
    customer_image:{
        type:String,
        default:""
    },
    customer_phone:{
        type:String,
        default:""
    },
    ratedProviders:[
        {
            type:mongoose.Schema.Types.ObjectId,
        }
    ]
},
{
    timestamps:true
}
)
module.exports = mongoose.model("customer", customerSchema)
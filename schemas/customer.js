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
    ],
    requested_Providers:[
        {
            requested_provider_id:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"provider"
            },
            serviceId:{
                type:String
            },
            date:{
                type:Date,
                default:Date.now
            },
            status:{
                type:String,
                default:"pending"
            },
            service_description:{
                type:String,
            },
            proceed:{
                type:Boolean,
                default:false
            }
        }
    ]
},
{
    timestamps:true
}
)
module.exports = mongoose.model("customer", customerSchema)
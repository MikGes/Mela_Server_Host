const mongoose = require("mongoose");
const providerSchema = new mongoose.Schema({
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
    rating:{
        type:Number,
        default:0,

    },
    birr:{
        type:Number,
        default:0
    },
    km:{
        type:Number,
        default:null,
    },
    provider_image:{
        type:String,
        default:""
    },
    provider_description:{
        type:String,
        default:""
    },
    provider_phone:{
        type:String,
        default:""
    },
    status:{
        type:Boolean,
        default:false
    },
    verified:{
        type:Boolean,
        default:false
    },
    services:{
        type:Array
    },
    ratedBy:[
        {
            rated_customer:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"customer",
            },
            rateMessage:{
                type:String
            },
            rate:{
                type:Number
            },
            date:{
                type:Date,
                default:Date.now
            }

        }
    ],
    serviceRequest:[
        {
            request_customer_id:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"customer",
            },
            serviceId:{
                type:String
            },
            service_description:{
                type:String,
                required:[true,"Please enter a short description"],
            },
            date:{
                type:Date,
                default:Date.now
            },
            status:{
                type:String,
                default:"pending"
            },
            proceeded_by_Customer:{
                type:Boolean,
                default:false
            },
            
        }
    ],
    location:{
        latitude:{
            type:Number,
            default:""
        },
        longitude:{
            type:Number,
            default:""
        }
    }
    
},
{
    timestamps:true
}
)
module.exports = mongoose.model("provider", providerSchema)
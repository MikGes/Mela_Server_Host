const mongoose = require("mongoose");
const reportSchema = new mongoose.Schema({
    reporter_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"customer",
    },
    reported_provider_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"provider"
    },
    reportMessage:{
        type:String,
        required:true
    },

})
module.exports = mongoose.model("report",reportSchema)
const mongoose = require('mongoose')
const serviceSchema = new mongoose.Schema({
    name:{
        type:String
    },
    serviceImage:{
        type:String
    }
})

module.exports = mongoose.model("services",serviceSchema)
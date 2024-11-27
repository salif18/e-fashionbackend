const mongoose = require("mongoose")
const schema = mongoose.Schema({
    name:{type:String , require:true},
    image:{type:String , require:true},
},  { timestamps: true })

module.exports = mongoose.model("Marques", schema);
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    dailyAvailableTime:{
        type:Number,
        default:2
    }

});


module.exports = mongoose.model(
    "User",
    userSchema
);
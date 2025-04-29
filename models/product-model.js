const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    image:Buffer,
    name:String,
    price:String,
    discount:{
        type:Number,
        default:0
    },
    bgcolor:{
        type:String,
        default:"black"
    },
    panelcolor:{
        type:String,
        default:"grey"
    },
    textcolor:{
        type:String,
        default:"white"
    },
    ownerid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"owner"
    },
    stock:Number,
    description:String,
    category:String,
    rating:Number,
    rating:{
        type:Number,
        default:0
    }
})

module.exports = mongoose.model("product",productSchema)
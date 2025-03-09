const mongoose = require('mongoose');



const productSchema = mongoose.Schema({
    image:Buffer,
    name:String,
    price:Number,
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
        default:"black"
    },
    textcolor:{
        type:String,
        default:"black"
    },    
})

module.exports = mongoose.model('product', productSchema);
const mongoose = require ('mongoose');


const cartSchema =  mongoose.Schema({
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    productid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"product",
        required:true
    },
    quantity:{
        type:Number,
        default:1
    },
    date:{
        type:Date,
        default:Date.now
    }
})

module.exports = mongoose.model('cart',cartSchema)
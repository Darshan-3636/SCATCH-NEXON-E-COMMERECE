const mongoose = require ('mongoose');


const orderSchema =  mongoose.Schema({
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    productid:[{
        type:mongoose.Schema.Types.ObjectId,
        default:[],
        ref:"product"
    }],
    company:String,
    date:{
        type:Date,
        default:Date.now
    },
    orderStatus:{
        Type:String,
        default:"pending"
    }
})

module.exports = mongoose.model('order',orderSchema)
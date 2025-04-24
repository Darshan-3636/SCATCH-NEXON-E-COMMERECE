const mongoose  = require('mongoose');

const revratSchema = mongoose.Schema({
    productid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'product'
    },
    rating:[{
        userid:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'user'
        },
        rating:Number
    }],
    review:[{
        userid:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'user'
        },
        review:String
    }]
})

module.exports = mongoose.model('revrat',revratSchema)
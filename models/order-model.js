// const mongoose = require ('mongoose');


// const orderSchema =  mongoose.Schema({
//     userid:{
//         type:mongoose.Schema.Types.ObjectId,
//         ref:"user",
//         required:true
//     },
//     orders:[{
//         products:[{
//             productid:{
//                 type:mongoose.Schema.Types.ObjectId,
//                 ref:"product",
//                 required:true
//             },
//             quantity: {
//                 type: Number,
//                 required: true,
//                 default: 1
//             },
//             date:{
//                 type:Date,
//                 default:Date.now
//             },
//             orderStatus:{
//                 type:String,
//                 default:"pending"
//             }
//         }]
//     }]
    
// })

// module.exports = mongoose.model('order',orderSchema)

const mongoose = require ('mongoose');


const orderSchema =  mongoose.Schema({
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
    },
    orderStatus:{
        type:String,
        default:"pending"
    },
    totalAmount:Number,
    refund:{
        type:String,
        default:"not-required"
    }
})

module.exports = mongoose.model('order',orderSchema)
const { HostAddress } = require('mongodb');
const mongoose = require('mongoose');

// const userSchema = mongoose.Schema({
//     fullname:{
//         type:String,
//         minLength:3,
//         trim:true
//     },
//     email:String,
//     password:String,
//     cart:[{
//         type:mongoose.Schema.Types.ObjectId,
//         ref:"product"
//     }],
//     orders:[{
//         type:mongoose.Schema.Types.ObjectId,
//         default:[]
//     }],
//     contact:Number,
//     picture:String
    
// })

const userSchema = mongoose.Schema({
    username:String,
    password:String,
    email:String,
    role:{
        type:String,
        default:"customer"
    },
    contact:Number,
    picture:Buffer,
    cart:[{
        type:mongoose.Schema.Types.ObjectId,
        default:[],
        ref:"product"
    }],
    address:String,
})

module.exports = mongoose.model('user', userSchema);
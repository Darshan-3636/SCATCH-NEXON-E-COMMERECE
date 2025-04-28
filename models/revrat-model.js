const mongoose  = require('mongoose');

const revratSchema = mongoose.Schema({
    productid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product'
    },
    review: [{
        userid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
        },
        comment: {
            type: String,
            maxlength: 500
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true }); 

module.exports = mongoose.model('revrat',revratSchema)
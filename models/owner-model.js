const mongoose = require ('mongoose');


const ownerSchema =  mongoose.Schema({
    username:String, // sign up details done
    password:String, // register done
    email:String, // register done
    role:{
        type:String,
        default:"owner"
    },
    company:String,
    companyPicture:Buffer,// sign up details done
    products:[{
        type:mongoose.Schema.Types.ObjectId,
        default:[],
        ref:"product"
    }],
    picture:Buffer, //sign-up details
    phone:String, //sign-up details done
    events: [ 
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Add unique ID to each event
            title: String,
            start: {
                type:Date,
            },
            description: String,
            backgroundColor: { type: String, default: '#007BFF' },
            borderColor: { type: String, default: '#007BFF' }
        }
    ]
});
module.exports = mongoose.model('owner',ownerSchema)
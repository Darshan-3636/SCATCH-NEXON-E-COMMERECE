const express = require('express');
const router = express.Router();
const {registerUser, loginUser}= require('../controllers/authController');
const upload = require("../config/multer-config");
const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const {generateToken} = require('../utils/genrateToken')

router.post('/register',upload.single('profile'),async (req, res)=>{
    try{
        let {email, password, username, phone , address} = req.body;

        let user = await userModel.findOne({email: email})
        if (user) {
            req.flash("error","you have already registed, please login");
            res.redirect('/login')
        } 
        else {
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(password, salt,async function(err, hash) {
                    if (err) return res.send(err.message);
                    else{
                        let user = await userModel.create({
                            email,
                            password:hash,
                            username,
                            contact:phone,
                            address,
                            picture:req.file.buffer
                        })
                        let token = generateToken(user)
                        res.cookie("token",token)
                        req.flash('success','you have successfully created an account')
                        res.redirect('/shop');
                    }  
                });
            });
        }    
    }
    catch(err){
        req.flash("error",err.message);
        res.redirect('/login')
    }
});

router.post('/login',loginUser);


module.exports = router;
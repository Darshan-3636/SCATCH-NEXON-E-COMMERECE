const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const {generateToken} = require('../utils/genrateToken')



module.exports.loginUser =  async (req, res)=>{
    let {email , password} = req.body;

    let user = await userModel.findOne({email})
    if(!user) {
        req.flash('error','Email or Password incorrect');
        res.redirect('/login')
    }     else{
            bcrypt.compare(password,user.password,(err,result)=>{
                if(result){
                    let token = generateToken(user);
                    req.flash('success',"You have successfully logged in")
                    res.cookie("token",token);
                    res.redirect('/shop');
                }else{
                    req.flash('error','Email or Password incorrect');
                    res.redirect('/login')
                }
            })
        }
}

module.exports.logout = (req, res)=>{
    req.flash("success","you have been logged out!")
    res.cookie("token","")
    res.redirect('/login')
}
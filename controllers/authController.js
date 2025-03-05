const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const {generateToken} = require('../utils/genrateToken')

module.exports.registerUser = async (req, res)=>{
    try{
        let {email, password, fullname} = req.body;

        let user = await userModel.findOne({email: email})
        if (user) {
            req.flash("error","you have already registed, please login");
            res.redirect('/')
        } 
        else {
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(password, salt,async function(err, hash) {
                    if (err) return res.send(err.message);
                    else{
                        let user = await userModel.create({
                            email,
                            password:hash,
                            fullname
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
        console.log(err.message)
    }
}

module.exports.loginUser =  async (req, res)=>{
    let {email , password} = req.body;

    let user = await userModel.findOne({email})
    if(!user) {
        req.flash('error','Email or Password incorrect');
        res.redirect('/')
    }     else{
            bcrypt.compare(password,user.password,(err,result)=>{
                if(result){
                    let token = generateToken(user);
                    req.flash('success',"You have successfully logged in")
                    res.cookie("token",token);
                    res.redirect('/shop');
                }else{
                    req.flash('error','Email or Password incorrect');
                    res.redirect('/')
                }
            })
        }
}

module.exports.logout = (req, res)=>{
    req.flash("success","you have been logged out!")
    res.cookie("token","")
    res.redirect('/')
}
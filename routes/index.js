const express = require("express");
const router =  express.Router();
const {logout}= require('../controllers/authController')
const isLoggedIn = require('../middlewares/isLoggedIn');
const productModel = require('../models/product-model')
const userModel = require('../models/user-model')


router.get('/',function (req, res){
    let error = req.flash('error')
    let success = req.flash('success')
    res.render('index',{error, success , loggedin: false});
})

router.get('/shop', isLoggedIn, async (req, res)=>{
    let error = req.flash('error')
    let success = req.flash('success')
    let products = await productModel.find();
    res.render('shop',{products,error,success});
})

router.get('/cart',isLoggedIn, async (req , res)=>{
    let user = await userModel.findOne({email:req.user.email}).populate('cart');
    res.render('cart',{user})
})

router.get('/addtocart/:pid', isLoggedIn, async (req, res)=>{
    let user = await userModel.findOne({email: req.user.email })
    user.cart.push(`${req.params.pid}`)
    await user.save()
    req.flash('success','added to your cart!')
    res.redirect('/shop');
})

router.get('/logout', logout);

module.exports = router;
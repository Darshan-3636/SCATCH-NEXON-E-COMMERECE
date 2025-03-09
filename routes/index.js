const express = require("express");
const router =  express.Router();
const {logout}= require('../controllers/authController')
const isLoggedIn = require('../middlewares/isLoggedIn');
const productModel = require('../models/product-model')
const userModel = require('../models/user-model');
const cartModel= require('../models/cart-model')


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
    let error = req.flash('error')
    let success = req.flash('success')
    let cart = await cartModel.find({userid:req.user.id}).populate('productid');
    res.render('cart',{cart,error,success})
})


router.get('/addtocart/:pid', isLoggedIn, async (req, res) => {
    try {
        let { pid } = req.params;
        let userid = req.user._id;

        let cartItem = await cartModel.findOne({ userid, productid:pid });

        if (cartItem) {
            cartItem.quantity += 1;
            await cartItem.save();
        } else {
            await cartModel.create({ userid, productid:pid, quantity: 1 });
        }
        req.flash('success', 'Product added to your cart!');
        res.redirect('/shop');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong');
        res.redirect('/shop');
    }
});

router.get('/addquantity/:cid', isLoggedIn,async (req, res)=>{
   try{
    let cartitem = await cartModel.findOne({_id:req.params.cid})

    if (cartitem){
        cartitem.quantity += 1
        await cartitem.save();
        req.flash('success','Quantity Increased')
        res.redirect('/cart');
    }else {
        req.flash('error','Something went Wrong');
        res.redirect('/cart');
    }
   }catch(err){
    req.flash('error','Something went Wrong');
    res.redirect('/cart')
   }
})

router.get('/reducequantity/:cid', isLoggedIn,async (req, res)=>{
   try{
    let cartitem = await cartModel.findOne({_id:req.params.cid})

    if (cartitem){
        cartitem.quantity -= 1
        await cartitem.save();
        

        if(cartitem.quantity === 0){
            await cartModel.deleteOne({_id:req.params.cid})
            req.flash('success','Item Removed From Cart');
            return res.redirect('/cart');
        }
        
        req.flash('success','Quantity Decreased')
        return res.redirect('/cart');
        
    }else {
        req.flash('error','Something went Wrong');
        res.redirect('/cart');
    }
   }catch(err){
    req.flash('error','Something went Wrong');
    res.redirect('/cart')
   }
})

router.get('/logout', logout);

module.exports = router;
const express = require("express");
const router =  express.Router();
const {logout}= require('../controllers/authController')
const isLoggedIn = require('../middlewares/isLoggedIn');
const productModel = require('../models/product-model')
const userModel = require('../models/user-model');
const cartModel= require('../models/cart-model');
const orderModel = require('../models/order-model');


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

router.get('/orders',isLoggedIn , async (req ,res)=>{
    let error =  req.flash('error')
    let success =  req.flash('success')
    let orders = await orderModel.find({userid:req.user._id}).populate('productid')
    res.render('orders',{orders,error,success})
})

router.post('/addtoorders', isLoggedIn, async (req, res) => {
    try {
        let userid = req.user._id;

        // Get all cart items for the user
        let cartItems = await cartModel.find({ userid });

        if (cartItems.length === 0) {
            req.flash('error', 'Your cart is empty!');
            return res.redirect('/cart');
        }

        // Convert cart items to order format
        let orders = cartItems.map(item => ({
            userid: item.userid,
            productid: item.productid,
            quantity: item.quantity,
        }));

        // Insert all orders in bulk
        await orderModel.insertMany(orders);

        // Remove all cart items for this user
        await cartModel.deleteMany({ userid });

        req.flash('success', 'Order placed successfully!');
        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong');
        res.redirect('/cart');
    }
})

router.get('/reorder/:oid', isLoggedIn, async (req, res) => {
    try {
        let order = await orderModel.findOne({ _id:req.params.oid });

        if (order.length === 0) {
            req.flash('error', 'Order Not Found');
            return res.redirect('/orders');
        }

        await cartModel.create({
            userid:order.userid,
            productid:order.productid,
            quantity:order.quantity
        });

        req.flash('success', 'Product added to your cart!');
        res.redirect('/orders');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong');
        res.redirect('/orders');
    }
})

router.get('/removeorder/:oid', isLoggedIn, async (req, res) => {
    try {
        const order = await orderModel.findById(req.params.oid);
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/orders');
        }

        // Check if the order was placed more than 7 days ago
        const orderDate = new Date(order.date);
        const currentDate = new Date();
        const daysDifference = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

        if (daysDifference > 7) {
            req.flash('error', 'Order cannot be cancelled after 7 days');
            return res.redirect('/orders');
        }

        // Check if the order has been accepted
        if (order.orderStatus === 'Accepted') {
            req.flash('error', 'Order has already been accepted and cannot be cancelled');
            return res.redirect('/orders');
        }

        // If conditions are met, delete the order
        await orderModel.deleteOne({ _id: req.params.oid });
        req.flash('success', 'Order Cancelled');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong');
    }

    res.redirect('/orders');
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

router.get('/removeitem/:pid', isLoggedIn,async (req, res)=>{
   try{
    let cartitem = await cartModel.find({productid:req.params.pid})

    if(cartitem){
        await cartModel.deleteMany({productid:req.params.pid})
        req.flash('success','Item Removed From Cart')
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
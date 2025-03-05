const express = require('express');
const router = express.Router();
const {createProduct} = require('../controllers/productController');
const upload = require('../config/multer-config')
const productModel = require('../models/product-model')
const isLoggedin = require('../middlewares/isLoggedIn')
router.get('/', (req, res)=>{
    res.send('hellop');
});

router.post('/create', upload.single('image'), isLoggedin,async (req, res)=>{
   try{ 
    let {name, price, discount, bgcolor, panelcolor, textcolor} = req.body;

    await productModel.create({
        image: req.file.buffer,
        name,
        price,
        discount,
        bgcolor,
        panelcolor,
        textcolor 
    })
     req.flash('success','Product Created!');
     res.redirect('/owners/admin') 
    }
    catch(err){
        req.flash('error',err.message);
        res.redirect('/owners/admin')
    }
});

module.exports = router;
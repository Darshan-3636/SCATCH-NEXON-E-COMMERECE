const productModel = require('../models/product-model')

module.exports.createProduct = async (req, res)=>{

    let {name , price} = req.body;

    let Cp = await productModel.create({
        name,
        price
    })
    res.send(Cp);
}
const express = require("express");
const router = express.Router();
const { logout } = require("../controllers/authController");
const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const cartModel = require("../models/cart-model");
const orderModel = require("../models/order-model");
const axios = require("axios");
const uniqid = require("uniqid");
const sha256 = require('sha256')
const { 
  getAccountDetails, 
  getUpdateAccount,
  updateAccountDetails 
} = require('../controllers/accountController');
const upload = require('../config/multer-config');

// Route to get account details
router.get('/account', isLoggedIn, getAccountDetails);

// Route to get update account page
router.get('/update-account', isLoggedIn, getUpdateAccount);

// Route to update account details
router.post('/account', isLoggedIn, updateAccountDetails);

router.post('/account-profile',isLoggedIn ,upload.single('profile'),async (req, res)=>{
  try{
    await userModel.updateOne({_id:req.user._id},{picture:req.file.buffer});
    req.flash('success', 'Profile Picture Updated');
    return res.redirect(req.get("Referrer") || "/");
    }
    catch(err){
        if(req.file === undefined){
            req.flash('error', 'Select Picture First');
            return res.redirect(req.get("Referrer") || "/");
        }
        
        req.flash('error', 'Something went Wrong');
        return res.redirect(req.get("Referrer") || "/");
    }
})

router.get("/", function (req, res) {
  res.redirect('/shop');
});

router.get("/login", function (req, res) {
  let error = req.flash("error");
  let success = req.flash("success");
  res.render("index", { error, success });
});

router.get("/shop", async (req, res) => {
  try {
    let error = req.flash("error");
    let success = req.flash("success");

    
    let query = req.query.q ? req.query.q.trim() : "";
    let sortBy = req.query.sortby || ""; 
    let category = req.query.category || "all";
    let availability = req.query.availability || "";
    let discount = req.query.discount || "";

    let filter = {};

    //search //---- done
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    // Category filter //done ---
    if (category === "discounted") {
        filter.discount = { $gt: 0 }; // Ensures discount is greater than 0
    }

    //  Availability filter //----done
    if (availability === "inStock") {
      filter.stock = { $gt: 0 }; // Products with stock > 0
    } else if (availability === "outOfStock") {
      filter.stock = 0; // Products with no stock
    }

    // Discount 
    if (discount === "true") {
      filter.discount = { $gt: 0 }; // Ensures discount is greater than 0
    }

    // Sorting 

    let sorting

    if(sortBy === "priceLowHigh"){
      sorting = {price:1}
    } else if (sortBy === "priceHighLow"){
      sorting = {price:-1}
    }
    // Fetch products with applied filters and sort options
    let products = await productModel.find(filter).sort(sorting);
    
    let loggedin
    if(!req.cookies.token === ""){
      loggedin = 1
    }

    if(req.cookies.token === ""){
      loggedin = 0;
    }

    res.render("shop", {
      products,
      query,
      sortBy,
      category,
      availability,
      discount,
      error,
      success,
      loggedin
    });

  } catch (err) {
    console.error(err);
    req.flash("error", "Error loading products!");
    res.redirect("/");
  }
});

router.get("/cart", isLoggedIn, async (req, res) => {
  let error = req.flash("error");
  let success = req.flash("success");
  let cart = await cartModel
    .find({ userid: req.user.id })
    .populate("productid").sort({date:-1});
  res.render("cart", { cart, error, success });
});

router.get("/addtocart/:pid", isLoggedIn, async (req, res) => {
  try {
    let { pid } = req.params;
    let userid = req.user._id;

    let product = await productModel.findById(pid)

    if(product.stock >0 ){
      let cartItem = await cartModel.findOne({ userid, productid: pid })
        if (cartItem) {
          if(cartItem.quantity === product.stock){
            req.flash("error", `Only ${product.stock} available`);
            return res.redirect("/shop");
          }
          cartItem.quantity += 1;
          await cartItem.save();
        } else {
          await cartModel.create({ userid, productid: pid});
        }
        req.flash("success", "Product added to your cart!");
        return res.redirect("/shop"); 
    } else {
      req.flash("error", "Product Out Of Stock");
      return res.redirect("/shop");
    }
  } catch (error) {
    console.error(error);
    req.flash("error", "Something Went Wrong");
    res.redirect("/shop");
  }
});

router.get("/orders", isLoggedIn, async (req, res) => {
  let error = req.flash("error");
  let success = req.flash("success");
  let orders = await orderModel
    .find({ userid: req.user._id })
    .populate("productid").sort({date:-1});
  res.render("orders", { orders, error, success });
});

router.post("/addtoorders", isLoggedIn, async (req, res) => {
  try {
    let userid = req.user._id;

    // Get all cart items for the user
    let cartItems = await cartModel.find({ userid }).populate("productid");

    if (cartItems.length === 0) {
      req.flash("error", "Your cart is empty!");
      return res.redirect("/cart");
    }

    // Check stock availability for all items
    for (let item of cartItems) {
      if (item.productid.stock < item.quantity) {
        req.flash("error", `Not enough stock for ${item.productid.name}`);
        return res.redirect("/cart");
      }
    }

    // Convert cart items to order format
    let orders = cartItems.map((item) => {
      const price = item.productid?.price || 0;
      const discount = item.productid?.discount || 0;
      const quantity = item.quantity || 1;
    
      return {
        userid: item.userid,
        productid: item.productid._id,
        quantity,
        totalAmount: (price - discount) * quantity
      };
    });
    

    // Reduce stock in productModel for all valid orders
    for (let item of cartItems) {
      await productModel.updateOne(
        { _id: item.productid._id },
        { $inc: { stock: -item.quantity } } // Decrease stock
      );
    }

    // Insert all orders in bulk
    await orderModel.insertMany(orders);

    // Remove all cart items for this user
    await cartModel.deleteMany({ userid });

    req.flash("success", "Order placed successfully!");
    res.redirect("/cart");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong");
    res.redirect("/cart");
  }
});


router.get("/reorder/:oid", isLoggedIn, async (req, res) => {
  try {
    let order = await orderModel.findOne({ _id: req.params.oid });

    if (order.length === 0) {
      req.flash("error", "Order Not Found");
      return res.redirect("/orders");
    }

    await cartModel.create({
      userid: order.userid,
      productid: order.productid,
      quantity: order.quantity,
    });

    req.flash("success", "Product added to your cart!");
    res.redirect("/orders");
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong");
    res.redirect("/orders");
  }
});

router.get("/removeorder/:oid", isLoggedIn, async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.oid);
    if (!order) {
      req.flash("error", "Order not found");
      return res.redirect("/orders");
    }

    // Check if the order was placed more than 7 days ago
    const orderDate = new Date(order.date);
    const currentDate = new Date();
    const daysDifference = Math.floor(
      (currentDate - orderDate) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference > 7) {
      req.flash("error", "Order cannot be cancelled after 7 days");
      return res.redirect("/orders");
    }

    // Check if the order has been accepted
    if (order.orderStatus === "Accepted") {
      req.flash(
        "error",
        "Order has already been accepted and cannot be cancelled"
      );
      return res.redirect("/orders");
    }

    // If conditions are met, delete the order
    await orderModel.deleteOne({ _id: req.params.oid });
    req.flash("success", "Order Cancelled");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
  }

  res.redirect("/orders");
});

router.get("/addquantity/:cid", isLoggedIn, async (req, res) => {
  try {
    let cartitem = await cartModel.findOne({ _id: req.params.cid }).populate('productid');

    if (cartitem && cartitem.quantity < cartitem.productid.stock) {
      cartitem.quantity += 1;
      await cartitem.save();
      req.flash("success", "Quantity Increased");
      res.redirect("/cart");
    } else if(cartitem.quantity === cartitem.productid.stock){
      req.flash("error", `Only ${cartitem.productid.stock} Available`);
      res.redirect("/cart");
    }
  } catch (err) {
    req.flash("error", "Something went Wrong");
    res.redirect("/cart");
  }
});

router.get("/reducequantity/:cid", isLoggedIn, async (req, res) => {
  try {
    let cartitem = await cartModel.findOne({ _id: req.params.cid });

    if (cartitem) {
      cartitem.quantity -= 1;
      await cartitem.save();

      if (cartitem.quantity === 0) {
        await cartModel.deleteOne({ _id: req.params.cid });
        req.flash("success", "Item Removed From Cart");
        return res.redirect("/cart");
      }

      req.flash("success", "Quantity Decreased");
      return res.redirect("/cart");
    } else {
      req.flash("error", "Something went Wrong");
      res.redirect("/cart");
    }
  } catch (err) {
    req.flash("error", "Something went Wrong");
    res.redirect("/cart");
  }
});

router.get("/removeitem/:cid", isLoggedIn, async (req, res) => {
  try {
    let cartitem = await cartModel.findById(req.params.cid);

    if (cartitem) {
      await cartModel.deleteOne({ _id: req.params.cid });
      req.flash("success", "Item Removed From Cart");
      return res.redirect("/cart");
    } else {
      req.flash("error", "Something went Wrong");
      res.redirect("/cart");
    }
  } catch (err) {
    req.flash("error", "Something went Wrong");
    res.redirect("/cart");
  }
});

router.get("/logout", logout);


//payment gatway

const MERCHANT_ID = 'PGTESTPAYUAT86';
const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const SALT_INDEX = 1;
const SALT_KEY = '96434309-7796-489d-8924-ab56988a6076';
const APP_BE_URL = "https://nexon-dashboard-78bm.onrender.com"; // our application


// endpoint to initiate a payment
router.post("/pay/:amount", isLoggedIn,async function (req, res, next) {
  // Initiate a payment

  // Transaction amount
  const amount = req.params.amount;

  // User ID is the ID of the user present in our application DB
  let userId = `${req.user.email}`;

  // Generate a unique merchant transaction ID for each transaction
  let merchantTransactionId = uniqid();

  // redirect url => phonePe will redirect the user to this url once payment is completed. It will be a GET request, since redirectMode is "REDIRECT"
  let normalPayLoad = {
    merchantId: MERCHANT_ID, //* PHONEPE_MERCHANT_ID . Unique for each account (private)
    merchantTransactionId: merchantTransactionId,
    merchantUserId: userId,
    amount: amount * 100, // converting to paise
    redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`,
    redirectMode: "REDIRECT",
    mobileNumber: "9999999999",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  // make base64 encoded payload
  let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
  let base64EncodedPayload = bufferObj.toString("base64");

  // X-VERIFY => SHA256(base64EncodedPayload + "/pg/v1/pay" + SALT_KEY) + ### + SALT_INDEX
  let string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
  let sha256_val = sha256(string);
  let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

  axios
    .post(
      `${PHONE_PE_HOST_URL}/pg/v1/pay`,
      {
        request: base64EncodedPayload,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          accept: "application/json",
        },
      }
    )
    .then(function (response) {
      res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
    })
    
    .catch(function (error) {
      res.send(error);
    });
});

// endpoint to check the status of payment
router.get("/payment/validate/:merchantTransactionId", async function (req, res) {
  const { merchantTransactionId } = req.params;
  // check the status of the payment using merchantTransactionId
  if (merchantTransactionId) {
    let statusUrl =
      `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/` +
      merchantTransactionId;

    // generate X-VERIFY
    let string =
      `/pg/v1/status/${MERCHANT_ID}/` + merchantTransactionId + SALT_KEY;
    let sha256_val = sha256(string);
    let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

    axios
      .get(statusUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          "X-MERCHANT-ID": merchantTransactionId,
          accept: "application/json",
        },
      })
      .then(function (response) {
        if (response.data && response.data.code === "PAYMENT_SUCCESS") {
          // redirect to FE payment success status page
          res.send(`
            <form action="/addtoorders" method="POST">
              <input type="hidden" name="key" value="value">
            </form>
            <script>
              document.forms[0].submit();
            </script>
          `);
          
        } else {
          req.flash('error','payment failed')
          res.redirect('/cart')
        }
      })
      .catch(function (error) {
        req.flash('error',`${error.data}`);
        res.redirect('/cart')
      });
  } else {
    req.flash('error',`Somthing Went Wrong`);
    res.redirect('/cart')
  }
});

module.exports = router;

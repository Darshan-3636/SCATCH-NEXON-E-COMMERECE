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

// Route to get account details
router.get('/account', isLoggedIn, getAccountDetails);

// Route to get update account page
router.get('/update-account', isLoggedIn, getUpdateAccount);

// Route to update account details
router.post('/account', isLoggedIn, updateAccountDetails);

router.get("/", function (req, res) {
  res.redirect('/shop');
});

router.get("/login", function (req, res) {
  let error = req.flash("error");
  let success = req.flash("success");
  res.render("index", { error, success });
});

router.get("/shop", async (req, res) => {
  let error = req.flash("error");
  let success = req.flash("success");

  let query = req.query.q ? req.query.q.trim() : "";
  let products;

  if (query) {
    // Case-insensitive search in product name and description
    products = await productModel.find({
      $or: [
        { name: { $regex: query, $options: "i" } }, 
        { description: { $regex: query, $options: "i" } }
      ]
    });
  } else {
    products = await productModel.find();
  }

  res.render("shop", { products, error, success, query });
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

    let cartItem = await cartModel.findOne({ userid, productid: pid })
    if (cartItem) {
      cartItem.quantity += 1;
      await cartItem.save();
    } else {
      await cartModel.create({ userid, productid: pid});
    }
    req.flash("success", "Product added to your cart!");
    res.redirect("/shop");
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
    let orders = cartItems.map((item) => ({
      userid: item.userid,
      productid: item.productid._id,
      quantity: item.quantity,
    }));

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
    let cartitem = await cartModel.findOne({ _id: req.params.cid });

    if (cartitem) {
      cartitem.quantity += 1;
      await cartitem.save();
      req.flash("success", "Quantity Increased");
      res.redirect("/cart");
    } else {
      req.flash("error", "Something went Wrong");
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

router.get("/removeitem/:pid", isLoggedIn, async (req, res) => {
  try {
    let cartitem = await cartModel.find({ productid: req.params.pid });

    if (cartitem) {
      await cartModel.deleteMany({ productid: req.params.pid });
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




const MERCHANT_ID = "M22WHG5I5GU1U"; // Your Merchant ID
const PHONE_PE_HOST_URL = "https://api.phonepe.com/apis/hermes"; // ✅ Production URL
const SALT_INDEX = 1; // Salt Index
const SALT_KEY = "6dd1a0fb-51ea-4312-9f6b-09d0415f42d0"; // Secret Key
const APP_BE_URL = "http://localhost:4000"; // ✅ Your production backend URL

// Initiate a payment
router.post("/pay/:amount", isLoggedIn, async (req, res) => {
  try {
    // const amount = req.params.amount * 100; // Convert to paise
    const userId = req.user.email;
    const merchantTransactionId = uniqid();

    const normalPayLoad = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: userId,
      amount:100,
      redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`,
      redirectMode: "REDIRECT",
      mobileNumber: req.user.contact,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    // Encode payload
    const base64EncodedPayload = Buffer.from(JSON.stringify(normalPayLoad), "utf8").toString("base64");

    // Generate X-VERIFY signature
    const string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
    const xVerifyChecksum = sha256(string) + "###" + SALT_INDEX;

    const response = await axios.post(
      `${PHONE_PE_HOST_URL}/pg/v1/pay`,
      { request: base64EncodedPayload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerifyChecksum,
          accept: "application/json",
        },
      }
    );

    if (response.data.success) {
      res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
    } else {
      throw new Error(response.data.message || "Payment initiation failed");
    }
  } catch (error) {
    console.error("Payment error:", error);
    req.flash("error", "Something went wrong while initiating payment.");
    res.redirect("/cart");
  }
});

router.post("/webhook/payment-status", async (req, res) => {
  try {
      const data = req.body; // PhonePe's response data
      console.log("Received webhook data:", data);

      // Validate request using X-VERIFY (optional for security)
      
      // Process the payment status
      if (data.code === "PAYMENT_SUCCESS") {
          // Update order status in your database
          return res.send('payment successfull')
      } else {
          return res.send('payment failed')
      }

      // Send success response to PhonePe
      res.status(200).send("Webhook received successfully");
  } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Error processing webhook");
  }
});


// Validate Payment Status
router.get("/payment/validate/:merchantTransactionId", async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;
    const statusUrl = `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`;

    const xVerifyString = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}${SALT_KEY}`;
    const xVerifyChecksum = sha256(xVerifyString) + "###" + SALT_INDEX;

    const response = await axios.get(statusUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerifyChecksum,
        "X-MERCHANT-ID": MERCHANT_ID,
        accept: "application/json",
      },
    });

    if (response.data.code === "PAYMENT_SUCCESS") {
      res.send(`
        <form action="/addtoorders" method="POST">
          <input type="hidden" name="key" value="value">
        </form>
        <script>document.forms[0].submit();</script>
      `);
    } else {
      req.flash("error", "Payment failed. Please try again.");
      res.redirect("/cart");
    }
  } catch (error) {
    console.error("Validation error:", error);
    req.flash("error", "Something went wrong while validating payment.");
    res.redirect("/cart");
  }
});

module.exports = router;

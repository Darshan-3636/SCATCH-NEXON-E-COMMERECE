const express = require('express');
const router = express.Router();
const { 
  getAccountDetails, 
  getUpdateAccount,
  updateAccountDetails 
} = require('../controllers/accountController');
const isLoggedIn = require('../middlewares/isLoggedIn');

// Route to get account details
router.get('/account', isLoggedIn, getAccountDetails);

// Route to get update account page
router.get('/update-account', isLoggedIn, getUpdateAccount);

// Route to update account details
router.post('/account', isLoggedIn, updateAccountDetails);

module.exports = router;

const userModel = require('../models/user-model');

const getAccountDetails = async (req, res) => {
  try {
    const user = req.user;
    res.render('account', { user });
  } catch (error) {
    res.status(500).send('Error retrieving account details');
  }
};

const getUpdateAccount = async (req, res) => {
  try {
    const user = req.user;
    res.render('update-account', { user });
  } catch (error) {
    res.status(500).send('Error loading update account page');
  }
};

const updateAccountDetails = async (req, res) => {
  try {
    const user = req.user;
    const { name, email, contact, address } = req.body;
    
    // Update user details, using existing values if not provided
    user.username = name || user.username;
    user.email = email || user.email;
    user.contact = contact || user.contact;
    user.address = address || user.address;
    
    await user.save();
    
    res.redirect('/account');
  } catch (error) {
    res.status(500).send('Error updating account');
  }
};

module.exports = {
  getAccountDetails,
  getUpdateAccount,
  updateAccountDetails
};
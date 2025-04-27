
const userModel = require('../models/user-model');

const getAccountDetails = async (req, res) => {
  try {
    let error = req.flash('error')
    let success = req.flash('success')
    const user = req.user;
    res.render('account', { user , error , success});
  } catch (error) {
    req.flash('error','Error retrieving account details')
    return res.redirect('/shop')
  }
};

const getUpdateAccount = async (req, res) => {
  try {
    const user = req.user;
    let error = req.flash('error')
    let success = req.flash('success')
    res.render('update-account', { user ,error , success});
  } catch (error) {
    req.flash('error','Error loading update account page')
    return res.redirect('/account')
  }
};

const updateAccountDetails = async (req, res) => {
  try {
    const user = req.user;
    const { name, email, contact, address } = req.body;

    // Check for duplicate email (excluding current user's own email)
    const exists = await userModel.findOne({ email });
    if (exists && user.email !== email) {
      req.flash('error', 'Email Already Exists');
      return res.redirect('/update-account');
    }

    // Track if anything is actually different
    const normalize = val => String(val || "").trim();

    const isChanged =
      normalize(name) !== normalize(user.username) ||
      normalize(email) !== normalize(user.email) ||
      normalize(contact) !== normalize(user.contact) ||
      normalize(address) !== normalize(user.address);
    
    if (!isChanged) {
      req.flash('error', 'No changes detected');
      return res.redirect('/update-account');
    }

    // Apply updates
    user.username = name;
    user.email = email;
    user.contact = contact;
    user.address = address;

    await user.save();

    req.flash('success', 'Updated Successfully');
    return res.redirect('/account');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something Went Wrong');
    return res.redirect('/update-account');
  }
};



module.exports = {
  getAccountDetails,
  getUpdateAccount,
  updateAccountDetails
};
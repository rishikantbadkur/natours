const express = require('express');

const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.loggedIn,
  viewsController.getOverview
);

router.get('/tour/:slug', authController.loggedIn, viewsController.getTour);

router.get('/login', authController.loggedIn, viewsController.getLoginForm);

router.get('/me', authController.protect, viewsController.getAccount);

router.get('/my-tours', authController.protect, viewsController.getMyTours);


module.exports = router;

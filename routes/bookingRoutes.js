const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validate');

router.route('/')
  .post(protect, validateBooking, bookingController.createBooking)
  .get(protect, bookingController.getBookings);

module.exports = router;

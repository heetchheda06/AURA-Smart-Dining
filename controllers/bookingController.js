const Booking = require('../models/Booking');

// @desc    Book a table
// @route   POST /api/bookings
// @access  Private (Authenticated users)
exports.createBooking = async (req, res, next) => {
  try {
    const { name, email, phone, seats, bookingDate } = req.body;

    const booking = await Booking.create({
      user: req.user.isGuest ? undefined : req.user._id,
      name,
      email,
      phone,
      seats: Number(seats),
      bookingDate,
      status: 'confirmed'
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings (User history or Admin view)
// @route   GET /api/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    let query = {};

    // Customers only see their own bookings
    if (req.user.role === 'customer' && !req.user.isGuest) {
      query = { user: req.user._id };
    } else if (req.user.isGuest) {
      // Guests don't have permanent accounts, search by email or phone
      query = { email: req.user.email || 'guest@domain.com' };
    }

    const bookings = await Booking.find(query).sort({ bookingDate: -1 });
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

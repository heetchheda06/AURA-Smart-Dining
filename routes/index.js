const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const menuRoutes = require('./menuRoutes');
const tableRoutes = require('./tableRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const bookingRoutes = require('./bookingRoutes');
const waiterRoutes = require('./waiterRoutes');
const adminRoutes = require('./adminRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const reviewRoutes = require('./reviewRoutes');

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/', menuRoutes); // category & menu APIs are mounted at root level of this group
router.use('/tables', tableRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/bookings', bookingRoutes);
router.use('/waiter', waiterRoutes);
router.use('/admin', adminRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reviews', reviewRoutes);

module.exports = router;

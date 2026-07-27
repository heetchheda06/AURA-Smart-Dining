const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, orderController.placeOrder)
  .get(protect, orderController.getOrders);

router.route('/:id')
  .get(protect, orderController.getOrderDetails);

router.route('/:id/status')
  .put(protect, authorize('chef', 'cashier', 'manager', 'waiter', 'admin', 'customer'), orderController.updateOrderStatus);

router.route('/:id/split/:count')
  .get(protect, orderController.splitBill);

module.exports = router;

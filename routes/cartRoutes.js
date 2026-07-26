const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.route('/:tableNum')
  .get(cartController.getCart);

router.route('/:tableNum/add')
  .post(cartController.addToCart);

router.route('/:tableNum/update')
  .post(cartController.updateQty);

router.route('/:tableNum/clear')
  .post(cartController.clearCart);

module.exports = router;

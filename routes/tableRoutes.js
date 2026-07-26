const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(tableController.getTables);

router.route('/:num/status')
  .put(protect, authorize('manager', 'cashier', 'chef', 'waiter', 'admin'), tableController.updateTableStatus);

module.exports = router;

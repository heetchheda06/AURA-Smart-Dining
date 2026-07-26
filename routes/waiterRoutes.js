const express = require('express');
const router = express.Router();
const waiterController = require('../controllers/waiterController');
const { protect, authorize } = require('../middleware/auth');

router.post('/call', waiterController.callWaiter);

router.route('/requests')
  .get(protect, authorize('waiter', 'admin'), waiterController.getWaiterRequests);

router.route('/requests/:id')
  .put(protect, authorize('waiter', 'admin'), waiterController.updateRequestStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

// Table endpoints
router.route('/')
  .get(tableController.getTables);

router.route('/:num/status')
  .put(tableController.updateTableStatus);

// Queue system endpoints
router.route('/queue')
  .get(tableController.getQueue);

router.route('/queue/join')
  .post(tableController.addToQueue);

router.route('/queue/:id')
  .delete(tableController.removeFromQueue);

router.route('/queue/seat/:id')
  .post(tableController.seatQueuedCustomer);

module.exports = router;

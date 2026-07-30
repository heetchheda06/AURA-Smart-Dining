const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

router.post('/request-bill', checkoutController.requestBill);
router.post('/select-payment-method', checkoutController.selectPaymentMethod);
router.post('/process-demo-payment', checkoutController.processDemoPayment);
router.post('/mark-cash-received', checkoutController.markCashReceived);
router.post('/update-cleaning-status', checkoutController.updateCleaningStatus);
router.post('/reopen-session', checkoutController.reopenSession);
router.post('/force-end-session', checkoutController.forceEndSession);
router.get('/sessions', checkoutController.getSessions);
router.get('/session/:tableNum', checkoutController.getSessionByTable);

module.exports = router;

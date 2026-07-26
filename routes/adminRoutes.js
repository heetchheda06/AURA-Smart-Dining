const express = require('express');
const multer = require('multer');
const router = express.Router();
const adminController = require('../controllers/adminController');
const csvController = require('../controllers/csvController');
const { protect, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Admin Dashboard & Analytics
router.get('/dashboard', adminController.getDashboardStats);
router.get('/analytics', adminController.getAnalytics);

// CSV Export Endpoints
router.get('/export/menu/csv', csvController.exportMenuCSV);
router.get('/export/orders/csv', csvController.exportOrdersCSV);
router.get('/export/tables/csv', csvController.exportTablesCSV);
router.get('/export/analytics/csv', csvController.exportAnalyticsCSV);

// CSV Import Endpoints
router.post('/import/menu/csv', upload.single('csvFile'), csvController.importMenuCSV);
router.post('/import/tables/csv', upload.single('csvFile'), csvController.importTablesCSV);

module.exports = router;

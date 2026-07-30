const express = require('express');
const router = express.Router();
const { getReviews, createReview, analyzeReviews } = require('../controllers/reviewController');

router.get('/', getReviews);
router.post('/', createReview);
router.post('/analyze', analyzeReviews);

module.exports = router;

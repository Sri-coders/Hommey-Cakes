const express = require('express');
const router = express.Router();
const { createReview, getCakeReviews } = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public fetches
router.get('/cake/:cakeId', getCakeReviews);

// Authorized customer posts (allowing up to 3 image uploads on reviews)
router.post('/', protect, upload.array('images', 3), upload.handleCloudinary, createReview);

module.exports = router;

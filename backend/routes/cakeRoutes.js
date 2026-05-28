const express = require('express');
const router = express.Router();
const {
  getCakes,
  getCakeById,
  getFeaturedCakes,
  createCake,
  updateCake,
  deleteCake
} = require('../controllers/cakeController');
const { protect, adminOnly } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public endpoints
router.get('/', getCakes);
router.get('/featured', getFeaturedCakes);
router.get('/:id', getCakeById);

// Admin-Only restricted endpoints (allowing array images uploads up to 5 files)
router.post('/', protect, adminOnly, upload.array('images', 5), upload.handleCloudinary, createCake);
router.put('/:id', protect, adminOnly, upload.array('images', 5), upload.handleCloudinary, updateCake);
router.delete('/:id', protect, adminOnly, deleteCake);

module.exports = router;

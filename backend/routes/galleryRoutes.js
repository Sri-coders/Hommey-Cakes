const express = require('express');
const router = express.Router();
const {
  getGallery,
  createGalleryItem,
  deleteGalleryItem
} = require('../controllers/galleryController');
const { protect, adminOnly } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public endpoints
router.get('/', getGallery);

// Admin-Only restricted endpoints (allowing single image or video file upload)
router.post('/', protect, adminOnly, upload.single('media'), createGalleryItem);
router.delete('/:id', protect, adminOnly, deleteGalleryItem);

module.exports = router;

const Gallery = require('../models/Gallery');
const fs = require('fs');
const path = require('path');

// @desc    Get all active gallery showcase media items
// @route   GET /api/gallery
// @access  Public
const getGallery = async (req, res, next) => {
  try {
    const media = await Gallery.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      media
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a media showcase file to the gallery (Admin only)
// @route   POST /api/gallery
// @access  Private/Admin
const createGalleryItem = async (req, res, next) => {
  try {
    const { description, mediaType } = req.body;

    if (!req.file) {
      res.status(400);
      throw new Error('Please select a media file to upload.');
    }

    const item = await Gallery.create({
      mediaUrl: `/uploads/${req.file.filename}`,
      mediaType: mediaType || (req.file.mimetype.startsWith('video/') ? 'Video' : 'Image'),
      description: description || '',
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Showcase item added to gallery successfully.',
      item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a media item from the gallery (Admin only)
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findByPk(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Gallery showcase item not found.');
    }

    // Delete static file
    const filePath = path.join(__dirname, '..', item.mediaUrl);
    if (fs.existsSync(filePath) && !item.mediaUrl.includes('product-')) {
      fs.unlinkSync(filePath);
    }

    await item.destroy();

    res.status(200).json({
      success: true,
      message: 'Media showcase item successfully deleted from gallery.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGallery,
  createGalleryItem,
  deleteGalleryItem
};

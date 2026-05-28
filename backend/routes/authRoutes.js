const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  googleAuth,
  updateProfileImage
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Authorized endpoints
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/image', protect, upload.single('profileImage'), upload.handleCloudinary, updateProfileImage);

module.exports = router;

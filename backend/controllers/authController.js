const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetOTP } = require('../utils/mailer');

// Local OTP Cache (Memory store for simulated password recovery)
const otpCache = new Map();

// Helper to sign JWT Tokens
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_hommey_cakes_token_key_2026_antigravity', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      res.status(400);
      throw new Error('Please fill in all registration fields.');
    }

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email address.');
    }

    // Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: 'User', // Force default role to 'User'
      status: 'Active'
    });

    // Send Welcome Email in background
    sendWelcomeEmail(user).catch(err => console.error('Error dispatching welcome email:', err.message));

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token: generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate User & Issue Token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter both email and password.');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401);
      throw new Error('Invalid email credentials.');
    }

    if (user.status === 'Blocked') {
      res.status(403);
      throw new Error('Your account is blocked by the administrator. Contact support.');
    }

    // Verify Hashed Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid password credentials.');
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token: generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        address: user.address,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - Send OTP Email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // console.log(email);
    // return;
    if (!email) {
      res.status(400);
      throw new Error('Please provide your email address.');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404);
      throw new Error('No account found with this email address.');
    }

    // Generate 6 Digit Code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Cache OTP
    otpCache.set(email, { otp, expiry });

    // Dispatch OTP Mailer
    await sendPasswordResetOTP(user, otp);

    res.status(200).json({
      success: true,
      message: 'One-Time Password (OTP) dispatched to your registered email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const password = req.body.password || req.body.newPassword;

    if (!email || !otp || !password) {
      res.status(400);
      throw new Error('Please fill in email, OTP, and new password.');
    }

    const cachedData = otpCache.get(email);
    if (!cachedData) {
      res.status(400);
      throw new Error('No pending OTP request found for this email.');
    }

    if (Date.now() > cachedData.expiry) {
      otpCache.delete(email);
      res.status(400);
      throw new Error('OTP has expired. Please request a new code.');
    }

    if (cachedData.otp !== otp) {
      res.status(400);
      throw new Error('Incorrect One-Time Password. Verification failed.');
    }

    // OTP Verified! Perform Password Hashing & Reset
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404);
      throw new Error('User not found.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    // Clear otp from cache
    otpCache.delete(email);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new credentials.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Logged in User Profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Profile details
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByPk(req.user.id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Continue with Google Sign-In (Login / Registration)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
  try {
    const { email, name, profile_image, credential } = req.body;
    
    let userEmail = email;
    let userName = name;
    let userPic = profile_image;

    // 1. If a Google GSI token is provided, verify it with Google's API
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const googleUser = await verifyRes.json();
        
        if (googleUser.email) {
          userEmail = googleUser.email;
          userName = googleUser.name || googleUser.given_name || 'Google User';
          userPic = googleUser.picture || null;
        } else {
          console.warn('Google GSI credential verification warning:', googleUser.error_description || 'Invalid token');
        }
      } catch (err) {
        console.error('Google GSI verification network error, falling back to body parameters:', err.message);
      }
    }

    if (!userEmail || !userName) {
      res.status(400);
      throw new Error('Google Sign-In failed. Missing email or name parameters.');
    }

    // 2. Check if user already exists
    let user = await User.findOne({ where: { email: userEmail } });

    if (user) {
      // Login flow: Check if blocked
      if (user.status === 'Blocked') {
        res.status(403);
        throw new Error('Your account is blocked by the administrator. Contact support.');
      }
      
      // Update profile picture if it was null
      if (userPic && !user.profile_image) {
        user.profile_image = userPic;
        await user.save();
      }
    } else {
      // Registration flow: Create a new user with Google details
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: userName,
        email: userEmail,
        password: hashedPassword,
        phone: '0000000000', // Default phone number for Google registrations
        role: 'User',
        status: 'Active',
        profile_image: userPic || null
      });

      // Send Welcome Email in background
      sendWelcomeEmail(user).catch(err => console.error('Error dispatching Google welcome email:', err.message));
    }

    res.status(200).json({
      success: true,
      message: 'Google Sign-In successful.',
      token: generateToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        address: user.address,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload and update user profile image
// @route   PUT /api/auth/profile/image
// @access  Private
const updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please select an image file to upload.');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found.');
    }

    // Save only filename to profile_image database field
    const fileName = req.file.filename;
    user.profile_image = fileName;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully.',
      profile_image: fileName,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  googleAuth,
  updateProfileImage
};

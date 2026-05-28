const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes to ensure user is logged in
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_hommey_cakes_token_key_2026_antigravity');

    // Fetch user from DB and attach to req
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found in system.' });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by Admin.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Token Verification Error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
  }
};

// Restrict access to Admins only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Forbidden. Access restricted to administrators only.' });
  }
};

module.exports = { protect, adminOnly };

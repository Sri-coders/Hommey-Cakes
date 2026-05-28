const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/error');

// Import REST Routers
const authRoutes = require('./routes/authRoutes');
const cakeRoutes = require('./routes/cakeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// 1. Establish Database Connection
connectDB();

// 2. Global Security & Parsing Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows serving local uploaded assets to different hosts (React frontend)
}));

// CORS Configuration
const allowedOrigin = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://hommey-cakes.vercel.app',
  'https://hommey-cakes.vercel.app'
];

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting (Prevent Brute force / Denial of Service)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// 3. Serve Static Assets
// Serve uploads folder containing cake preview images/videos
const os = require('os');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../img/shop')));
app.use('/uploads', express.static(os.tmpdir())); // Serverless zero-config fallback to serve files from writeable temp folder

// Serve template base assets if required
const rootImgPath = path.join(__dirname, '../img');
app.use('/uploads/img', express.static(rootImgPath));

// 4. REST API Endpoint Mounts
app.use('/api/auth', authRoutes);
app.use('/api/cakes', cakeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin', adminRoutes);

// Root Ping Check
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Hommey Cakes Shop Backend REST API is running perfectly.' });
});

// Contact Form Submission Route
app.post('/api/contact', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      res.status(400);
      throw new Error('Please fill in all contact form fields.');
    }

    const { sendContactEmail } = require('./utils/mailer');
    const emailResult = await sendContactEmail({ name, email, subject, message });

    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: 'Thank you! Your contact message has been dispatched to our bakery admins.'
      });
    } else {
      res.status(500);
      throw new Error(emailResult.error || 'Failed to dispatch email. Please try again.');
    }
  } catch (error) {
    next(error);
  }
});

// 5.中央例外 /Centralized Error Handlers
app.use(notFound);
app.use(errorHandler);

// 6. DB Sync & Listen
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // avoid alter:true in Vercel production
    // await sequelize.sync();

    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        console.log(
          `Hommey Cakes Server running in ${process.env.NODE_ENV || 'development'
          } mode on port ${PORT}`
        );
      });
    }
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
};

startServer();

// Important for Vercel
module.exports = app;

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Check if Cloudinary is configured in the environment
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';

// Use memory storage if Cloudinary is configured OR we are on Vercel/Production
// because serverless functions run on a read-only filesystem.
const useMemoryStorage = isCloudinaryConfigured || isVercel;

let storage;

if (useMemoryStorage) {
  storage = multer.memoryStorage();
} else {
  // Ensure local uploads folder exists for local development fallback
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
}

// File Type Filter
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp|mp4|mkv|mov|avi/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only standard image and video files are supported (jpeg, jpg, png, gif, webp, mp4, mkv, mov, avi)!'));
  }
};

// Multer Upload Instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // Limit files to 50MB (to comfortably support preview videos)
  },
  fileFilter: fileFilter
});

// Configure Cloudinary if keys are present
if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Helper function to upload a buffer stream to Cloudinary
const uploadToCloudinary = (fileBuffer, folder = 'hommey_cakes') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto' // automatic type detection
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Middleware to automatically upload files to Cloudinary if configured
const handleCloudinaryUpload = async (req, res, next) => {
  try {
    // If not using memory storage, there's no Cloudinary to process (we saved to disk)
    if (!useMemoryStorage) {
      return next();
    }

    // Check if any files were uploaded by Multer
    const hasFiles = req.file || (req.files && req.files.length > 0);
    if (!hasFiles) {
      return next();
    }

    // If memory storage is used but Cloudinary is not configured, check if we're on Vercel
    if (!isCloudinaryConfigured) {
      if (isVercel) {
        res.status(500);
        throw new Error(
          'Production environment detected, but Cloudinary credentials are not configured in Vercel Environment Variables. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
        );
      }
      return next();
    }

    // Perform Cloudinary upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'hommey_cakes_profile');
      req.file.cloudinaryUrl = result.secure_url;
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const result = await uploadToCloudinary(file.buffer, 'hommey_cakes_assets');
        file.cloudinaryUrl = result.secure_url;
      });
      await Promise.all(uploadPromises);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Attach the custom Cloudinary handler directly to the multer upload instance
upload.handleCloudinary = handleCloudinaryUpload;

module.exports = upload;

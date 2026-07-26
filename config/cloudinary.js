const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder',
  api_key: process.env.CLOUDINARY_API_KEY || 'placeholder',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder',
});

let storage;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'aura_dining',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
  });
} else {
  // Local storage fallback for development/testing if Cloudinary credentials are not provided
  console.warn('Cloudinary credentials not fully set. Falling back to local disk storage.');
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const fs = require('fs');
      const dir = './uploads';
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
}

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Custom simple cookie parser middleware
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('='));
      }
    });
  }
  req.cookies = cookies;
  next();
});

// Security headers (Helmet) with customized Content Security Policy for Google Sign-In and external images
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://accounts.google.com",
          "https://cdn.socket.io"
        ],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],
        "img-src": [
          "'self'",
          "data:",
          "https://images.unsplash.com",
          "https://res.cloudinary.com",
          "https://lh3.googleusercontent.com" // Google Profile images
        ],
        "connect-src": [
          "'self'",
          "ws:",
          "wss:",
          "https://accounts.google.com",
          "http://localhost:8080"
        ],
        "frame-src": [
          "'self'",
          "https://accounts.google.com"
        ]
      }
    }
  })
);

// Setup CORS
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'https://accounts.google.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && !origin.startsWith('http://localhost')) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api/', limiter);

// Express body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// HTML Portal Routes
app.get('/customer*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'customer.html')));
app.get('/manager*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'manager.html')));
app.get('/chef*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'chef.html')));
app.get('/cashier*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cashier.html')));
app.get('/403', (req, res) => res.sendFile(path.join(__dirname, 'public', '403.html')));

// API Routes
app.use('/api', routes);

// Base Route - Server Status Check
app.get('/status', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'AURA Smart Restaurant Management API is running.', 
    time: new Date() 
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;

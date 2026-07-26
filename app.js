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

// Security headers with open CSP for Cloud APIs & Render deployment
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// Setup open CORS for production deployment
app.use(cors({
  origin: true,
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
  max: 500, // Limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api/', limiter);

// Express body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from public folder (Vite build target)
app.use(express.static(path.join(__dirname, 'public')));

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

// SPA Catch-all Wildcard Route for React Frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;

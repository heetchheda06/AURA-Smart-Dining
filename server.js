require('dotenv').config();
const http = require('http');
const https = require('https');
const socketio = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');

const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS settings
const io = socketio(server, {
  cors: {
    origin: '*', // Allow all origins for production flexibility
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Attach socket server to express app so it can be accessed in controllers
app.set('io', io);

// Initialize real-time socket events
socketHandler(io);

// Keep-Alive Self-Ping Mechanism for Render Free Tier (Pings /status every 10 minutes)
if (process.env.NODE_ENV === 'production') {
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://aura-smart-dining.onrender.com/status';
  console.log(`🤖 Self-ping keep-alive service enabled for: ${RENDER_URL}`);
  
  setInterval(() => {
    https.get(RENDER_URL, (res) => {
      console.log(`📡 Self-ping response status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log(`⚠️ Self-ping error: ${err.message}`);
    });
  }, 10 * 60 * 1000); // 10 minutes
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});

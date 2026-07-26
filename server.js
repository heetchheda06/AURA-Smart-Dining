require('dotenv').config();
const http = require('http');
const https = require('https');
const socketio = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Attach socket instance to express app
app.set('io', io);

// Initialize real-time socket events
socketHandler(io);

// Keep-Alive Self-Ping for Render Free Tier (every 10 minutes)
if (process.env.NODE_ENV === 'production') {
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://aura-smart-dining.onrender.com/status';
  console.log(`🤖 Self-ping keep-alive enabled: ${RENDER_URL}`);
  setInterval(() => {
    https.get(RENDER_URL, (res) => {
      console.log(`📡 Self-ping: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log(`⚠️ Self-ping error: ${err.message}`);
    });
  }, 10 * 60 * 1000);
}

// ── Boot Sequence ─────────────────────────────────────────────────────────────
// Connect DB first, THEN start accepting HTTP requests
const boot = async () => {
  await connectDB();   // waits for MongoDB (up to 3 retries × 30s each)

  server.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`✅ Ready to accept requests.`);
  });
};

boot().catch(err => {
  console.error('❌ Boot failed:', err.message);
  process.exit(1);
});

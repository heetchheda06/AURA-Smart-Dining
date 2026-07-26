require('dotenv').config();
const http = require('http');
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

// Start server
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

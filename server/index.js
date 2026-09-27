require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const http = require('http');
const { Server } = require('socket.io');
const { chatSocket, userSocketsMap } = require('./sockets/chatSocket');
const path = require('path');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = [CLIENT_URL, 'http://localhost:5174', 'http://localhost:5173'];

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Setup chat sockets
chatSocket(io);

// Make io and userSocketsMap available in controllers
app.set('io', io);
app.set('userSocketsMap', userSocketsMap);

// Security Middleware
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow serving static images across origins if needed

// Body Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: ALLOWED_ORIGINS
}));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, require('./routes/userRoutes'));
app.use('/api/conversations', apiLimiter, require('./routes/conversationRoutes'));
app.use('/api/messages', apiLimiter, require('./routes/messageRoutes'));
app.use('/api/notifications', apiLimiter, require('./routes/notificationRoutes'));

// Root API
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Chat Application API"
  });
});

// Health API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Chat server is running"
  });
});

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Connect to MongoDB and Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

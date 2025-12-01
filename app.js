const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');

dotenv.config();

// Models
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// Initialize Express FIRST
const app = express();

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Node API Documentation',
      version: '1.0.0',
      description: 'API documentation for your Node.js backend',
    },
    servers: [
      {
        url: 'https://node-js-apis-lapr.onrender.com',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const profileRoutes = require('./routes/profileRoutes');
const productRoutes = require('./routes/productRoutes');

// Socket server must be created AFTER app
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => {
    console.error('❌ MongoDB connection FAILED:', err.message);
    process.exit(1);
  });

// Health Check
app.get('/', (req, res) => {
  res.send('API Status: Running. Server is listening for REST and Socket connections.');
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);

// --- SOCKET.IO AUTH ---
const activeUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: Token required.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token.'));
  }
});

// --- SOCKET.IO CONNECTION ---
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  activeUsers.set(socket.userId, socket.id);
  io.emit('onlineUsers', Array.from(activeUsers.keys()));

  socket.on('sendMessage', async ({ recipientId, content }) => {
    const senderId = socket.userId;

    try {
      let conversation = await Conversation.findOne({
        participants: {
          $all: [senderId, recipientId],
          $size: 2,
        },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, recipientId],
        });
      }

      const newMessage = await Message.create({
        content,
        sender: senderId,
        recipient: recipientId,
        conversation: conversation._id,
      });

      conversation.lastMessage = newMessage._id;
      await conversation.save();

      const messageToSend = await newMessage.populate('sender', 'name email');

      const recipientSocketId = activeUsers.get(recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('newMessage', messageToSend);
        io.to(recipientSocketId).emit('inboxUpdate', {
          conversationId: conversation._id,
          lastMessage: messageToSend,
        });
      }

      socket.emit('messageSentConfirmation', messageToSend);

    } catch (error) {
      console.error('Error handling sendMessage:', error);
      socket.emit('messageError', {
        recipientId,
        content,
        error: 'Failed to send and save message.',
      });
    }
  });

  socket.on('disconnect', () => {
    activeUsers.delete(socket.userId);
    io.emit('onlineUsers', Array.from(activeUsers.keys()));
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

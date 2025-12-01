const swaggerDocs = require('./swagger');

const express = require('express');
const http = require('http'); // 1. Import http module for Socket.IO
const socketio = require('socket.io'); // 2. Import socket.io
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 
const path = require('path');

// Load environment variables
dotenv.config();

// Models
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');


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
  apis: ['./routes/*.js'],  // all route files will be scanned
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
// Import your existing routes
const profileRoutes = require('./routes/profileRoutes'); // Existing route
const productRoutes = require('./routes/productRoutes'); // Existing route

const app = express();
const server = http.createServer(app); // 3. Create HTTP server from Express app
const io = socketio(server, { // 4. Attach Socket.IO to the HTTP server
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true }));
// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully!');        
    })
    .catch(err => {
        console.error('❌ MongoDB connection FAILED:', err.message);
        process.exit(1);
    });

// --- REST API Routes ---
// Basic Health Check Route (from your old app.js)
app.get('/', (req, res) => {
    res.send('API Status: Running. Server is listening for REST and Socket connections.');
});

// Mount your existing routes
app.use('/api/auth', authRoutes); 
app.use('/api/profile', profileRoutes); // Added from your old app.js
app.use('/api/products', productRoutes); // Added from your old app.js

// Mount the new chat routes
app.use('/api/chat', chatRoutes); 

// --- Socket.IO Real-time Connection Setup ---

// Map to track connected users and their socket IDs (for direct messaging)
const activeUsers = new Map(); // Key: userId (string), Value: socketId

// Middleware to authenticate the socket connection using JWT
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (token) {
        try {
            // Verify and decode the JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Attach the user ID to the socket object
            socket.userId = decoded.id; 
            next(); // Allow connection
        } catch (error) {
            console.error('Socket Auth Error:', error.message);
            next(new Error('Authentication error: Invalid token.'));
        }
    } else {
        next(new Error('Authentication error: Token required.'));
    }
});


io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.id})`);

    // Add user to the activeUsers map
    activeUsers.set(socket.userId, socket.id);
    
    // Notify all users about the updated list of online users (optional)
    io.emit('onlineUsers', Array.from(activeUsers.keys()));


    // --- 1. Handle sending a new message ---
    socket.on('sendMessage', async ({ recipientId, content }) => {
        const senderId = socket.userId;

        try {
            // 1. Find or Create Conversation
            let conversation = await Conversation.findOne({
                participants: { 
                    $all: [senderId, recipientId], 
                    $size: 2 
                }
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [senderId, recipientId]
                });
            }

            // 2. Save Message to Database
            const newMessage = await Message.create({
                content,
                sender: senderId,
                recipient: recipientId,
                conversation: conversation._id,
            });

            // 3. Update the conversation's last message reference and update timestamp
            conversation.lastMessage = newMessage._id;
            await conversation.save();

            // Prepare the message object for real-time delivery
            const messageToSend = await newMessage.populate('sender', 'name email');
            
            // 4. Real-time Delivery
            const recipientSocketId = activeUsers.get(recipientId);

            // Emit to the recipient
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('newMessage', messageToSend);
                io.to(recipientSocketId).emit('inboxUpdate', { conversationId: conversation._id, lastMessage: messageToSend });
            }
            
            // Emit confirmation back to the sender's client
            socket.emit('messageSentConfirmation', messageToSend);


        } catch (error) {
            console.error('Error handling sendMessage:', error);
            socket.emit('messageError', { 
                recipientId, 
                content, 
                error: 'Failed to send and save message.' 
            });
        }
    });

    // --- 2. Handle when user disconnects ---
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId} (${socket.id})`);
        
        // Remove the user/socket from the active users map
        activeUsers.delete(socket.userId);
        
        // Broadcast the updated online users list
        io.emit('onlineUsers', Array.from(activeUsers.keys()));
    });
});


// --- Start Server ---
// 5. Use server.listen() instead of app.listen()
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
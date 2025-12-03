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

// ------------------------
// ✅ ADD CORS HERE
// ------------------------
const cors = require("cors");
app.use(cors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true
}));
// ------------------------

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
        url: "https://node-js-apis-3.onrender.com",
        description: "Live Server"
      }
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middlewares
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

// Welcome Route
app.get('/', (req, res) => {
  res.send('API Status: Running. Server is listening for REST and Socket connections.');
});

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const profileRoutes = require('./routes/profileRoutes');
const productRoutes = require('./routes/productRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);

// SOCKET.IO Setup (keep as-is)
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// (Rest of your socket code... unchanged)

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

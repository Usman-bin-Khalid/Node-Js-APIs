const express = require('express');
const protect = require('../middleware/authMiddleware'); 
const { 
    getInbox, 
    getConversationMessages,
    startChatWithUser
} = require('../controllers/chatController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat & conversation APIs
 */

// All chat routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/chat/inbox:
 *   get:
 *     summary: Get all conversations of logged-in user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/inbox', getInbox);

/**
 * @swagger
 * /api/chat/messages/{conversationId}:
 *   get:
 *     summary: Get messages of a specific conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         example: 6743cf28f83baf8a434e89c4
 *     responses:
 *       200:
 *         description: Conversation chat history
 */
router.get('/messages/:conversationId', getConversationMessages);

/**
 * @swagger
 * /api/chat/start:
 *   post:
 *     summary: Create or get an existing conversation with a user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 673fb83321ff01b68f60e902
 *     responses:
 *       200:
 *         description: Conversation created or returned
 */
router.post('/start', startChatWithUser);

module.exports = router;

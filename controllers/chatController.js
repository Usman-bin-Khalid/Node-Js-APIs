const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper function to find a 1:1 conversation ID, or create a new one
const findOrCreateConversation = async (userId1, userId2) => {
    // MongoDB query to find a conversation where the participants array contains both IDs
    // The $all operator works regardless of the order of participants in the database
    let conversation = await Conversation.findOne({
        participants: { 
            $all: [userId1, userId2], 
            $size: 2 // Explicitly check for 1:1 chat 
        }
    }).populate('lastMessage');

    if (!conversation) {
        // Create new conversation if none exists
        conversation = await Conversation.create({
            participants: [userId1, userId2]
        });
        
        // Since it's a new conversation, lastMessage will be null, which is fine.
    }

    return conversation;
};

// 1. Get the list of all people the user has chatted with (Inbox API)
exports.getInbox = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all conversations where the logged-in user is a participant
        const conversations = await Conversation.find({
            participants: userId
        })
        .sort({ updatedAt: -1 }) // Sort by most recent activity
        .populate('lastMessage') // Get details of the last message
        .populate({
            // Populate the OTHER user in the conversation for the inbox view
            path: 'participants',
            match: { _id: { $ne: userId } }, // Exclude the logged-in user
            select: 'name email', // Select fields to return
        });

        // Format the response for clean client use
        const formattedInbox = conversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id.toString() !== userId.toString());
            
            return {
                conversationId: conv._id,
                otherUser: otherUser,
                lastMessage: conv.lastMessage ? {
                    content: conv.lastMessage.content,
                    createdAt: conv.lastMessage.createdAt,
                    senderId: conv.lastMessage.sender
                } : null,
                updatedAt: conv.updatedAt,
            };
        });

        res.status(200).json({ success: true, inbox: formattedInbox });

    } catch (error) {
        console.error('Error fetching inbox:', error);
        res.status(500).json({ success: false, message: 'Server error fetching conversations.' });
    }
};

// 2. Get specific person chat history (Chat Room API)
exports.getConversationMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        if (!userId) {
            console.log("Access denied: User ID could not be extracted.");
            return res.status(401).json({ success: false, message: 'Authentication required. User ID missing.' });
        }

        console.log("--- DEBUGGING CHAT HISTORY ---");
        console.log("1. Requested Conversation ID:", conversationId);
        console.log("2. Requesting User ID:", userId);

        // Debug Step: Try to find the conversation WITHOUT checking participants first
        const checkConv = await Conversation.findById(conversationId);
        
        if (!checkConv) {
             console.log("3. RESULT: Conversation does not exist in DB at all.");
             return res.status(404).json({ success: false, message: 'Conversation ID invalid.' });
        }

        console.log("3. Found Conversation Participants:", checkConv.participants);

        // Check if user is in the array (Manual check for debugging)
        const isParticipant = checkConv.participants.some(p => p.toString() === userId.toString());
        console.log("4. Is User a participant?", isParticipant);

        if (!isParticipant) {
             return res.status(404).json({ success: false, message: 'Access denied. You are not a participant.' });
        }

        // ORIGINAL LOGIC
        const messages = await Message.find({
            conversation: conversationId
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'name');

        res.status(200).json({ 
            success: true, 
            conversation: checkConv, 
            messages 
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// 3. Start a new chat or get an existing one by recipient ID (for starting a chat from a user profile)
exports.startChatWithUser = async (req, res) => {
    try {
        // DEBUGGING: Print what the server sees
        console.log("Logged in user:", req.user);
        console.log("Body received:", req.body);

        // SAFE ID EXTRACTION: Handle cases where req.user might be different
        // specific fix for "undefined" error:
        const userId1 = req.user._id || req.user.id; 

        const { recipientId } = req.body;

        if (!userId1) {
            return res.status(401).json({ success: false, message: 'User ID not found in request.' });
        }

        if (!recipientId) {
            return res.status(400).json({ success: false, message: 'Recipient ID is required.' });
        }

        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ success: false, message: 'Invalid recipient ID.' });
        }
        
        const userId2 = new mongoose.Types.ObjectId(recipientId);

        // FIX: Use toString() for safer comparison instead of .equals()
        // This prevents the "reading equals of undefined" crash
        if (userId1.toString() === userId2.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot start a chat with yourself.' });
        }

        const conversation = await findOrCreateConversation(userId1, userId2);

        res.status(200).json({ 
            success: true, 
            message: 'Conversation retrieved or created successfully.',
            conversationId: conversation._id
        });

    } catch (error) {
        console.error('Error starting chat:', error);
        res.status(500).json({ success: false, message: 'Server error starting conversation.' });
    }
};
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // The content of the message
    content: {
        type: String,
        required: true,
        trim: true,
    },
    
    
    // Who sent the message
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },


    // Who received the message (optional in a room setting, but useful for 1:1)
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // The conversation this message belongs to
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },

    // Status to track if the message has been read
    isRead: {
        type: Boolean,
        default: false,
    }

}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
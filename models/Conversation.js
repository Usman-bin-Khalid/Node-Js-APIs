const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    // Array of User IDs participating in the conversation.
    // Ensure this array contains exactly two distinct user IDs for 1:1 chat.
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    
    // Reference to the most recent message for displaying in the inbox view.
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
    },

    // A flag to ensure that only one conversation exists between any two users.
    // The index is created in the server.js/app.js file.
}, { timestamps: true });
// Pre-save hook to ensure participants are always stored in a sorted order
conversationSchema.pre('save', function(next) {
    if (this.isModified('participants') && this.participants.length === 2) {
        // Sort the array alphabetically based on the string representation of ObjectIds
        this.participants.sort(); 
    }
    next();
});

// Create a compound, unique index on the sorted array
conversationSchema.index(
    { participants: 1 }, 
    { unique: true }
);

// NOTE: A unique compound index (defined in app.js) will enforce 
// that a conversation between UserA and UserB is the same as UserB and UserA.
const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;
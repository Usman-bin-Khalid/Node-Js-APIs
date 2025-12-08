const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    // Link to the main User document (assuming you use a separate User model for auth)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to your existing User model
        required: true,
        unique: true
    },
  
    fullName: {
        type: String,
        trim: true,
        maxlength: 100
    },

    // Stores the public URL of the profile image from Cloudinary
    profileImage: {
        type: String,
        default: 'https://placehold.co/150x150/EEEEEE/313131?text=No+Image' // Default placeholder image
    },

    // Stores the public ID for the image, required for deleting/updating on Cloudinary
    cloudinaryId: {
        type: String
    },

    phoneNumber: {
        type: String,
        trim: true
    },
    
    location: {
        type: String,
        trim: true
    },
    
    // Array of strings to store interests
    interests: {
        type: [String],
        default: []
    }
}, {
    timestamps: true
});

const Profile = mongoose.model('Profile', ProfileSchema);
module.exports = Profile;
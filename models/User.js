const mongoose = require('mongoose');

// Define the schema for the User document
const userSchema = new mongoose.Schema({
    // Name is required, trimmed (whitespace removed), and must be a string.
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    // Email must be unique and is required.
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // Ensures no two users share the same email
        lowercase: true,
        trim: true,
        // Basic email validation regex
        match: [/.+@.+\..+/, 'Please enter a valid email address']
    },
    // Password is required and will be hashed before saving
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
    },
    // Date of birth
    dob: {
        type: Date,
        required: [true, 'Date of Birth is required'],
    },
    // Phone number is optional, but if provided, must be a string
    phoneNumber: {
        type: String,
        required: false,
    },
    // Interests is an array of strings, good for saving multiple tags
    interests: [{
        type: String,
        required: false,
    }],
}, 
// Mongoose automatically adds `createdAt` and `updatedAt` timestamps
{ timestamps: true });

// Create the User model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
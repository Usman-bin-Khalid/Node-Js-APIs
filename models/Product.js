const mongoose = require('mongoose');

// 1. Define the Schema for individual reviews
const reviewSchema = mongoose.Schema(
    {
        name: { type: String, required: true }, // Name of the reviewer
        rating: { type: Number, required: true }, // e.g., 1 to 5
        comment: { type: String, required: true },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Links the review to a specific user
        },
    },
    {
        timestamps: true, // Adds createdAt for the review itself
    }
);

// 2. Your existing Product Schema (with new fields added)
const ProductSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [100, 'Product name cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price must be a positive number']
    },
    quantity: {
        type: Number,
        required: [true, 'Product quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    images: [{
        url: { type: String, required: true },
        cloudinaryId: { type: String, required: true }
    }],
    
    // --- NEW SECTIONS FOR REVIEWS ---
    reviews: [reviewSchema], // An array containing the reviews
    
    rating: {
        type: Number,
        required: true,
        default: 0, // Average rating (e.g., 4.5)
    },
    numReviews: {
        type: Number,
        required: true,
        default: 0, // Total count of reviews
    },
    // -------------------------------

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', ProductSchema);
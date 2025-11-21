const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    // Reference to the user who created the product (the seller/admin)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Assuming you have a User model
    },
    // You mentioned productid, but MongoDB already creates _id, 
    // so we'll use that as the unique identifier.
    // product_sku could be an optional string field if a custom ID is required:
    // product_sku: { type: String, unique: true }, 
    
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
    // Array to store multiple image URLs and their public IDs from Cloudinary
    images: [{
        url: {
            type: String, // The secure_url from Cloudinary
            required: true
        },
        cloudinaryId: {
            type: String, // The public_id from Cloudinary
            required: true
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', ProductSchema);
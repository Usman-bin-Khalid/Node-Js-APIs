const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware'); // Your JWT middleware
const { uploadMultiple } = require('../utils/upload'); // The configured Multer middleware

// @route   POST /api/products
// @desc    Add a new product (Requires Auth and multiple file upload)
// @access  Private
router.post(
    '/', 
    authMiddleware, // 1. Check for JWT token
    uploadMultiple, // 2. Handle multiple file uploads to Cloudinary
    productController.addProduct // 3. Execute the controller logic
);

// Add other routes (GET, PUT, DELETE) here later...

module.exports = router;
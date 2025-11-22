const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware'); // Your JWT middleware
const { uploadMultiple } = require('../utils/upload'); // The configured Multer middleware

// @route   GET /api/products
// @desc    Get all products (Public)
// @access  Public
router.get('/', productController.getProducts);

// @route   GET /api/products/my
// @desc    Get all products created by the authenticated user (Private)
// @access  Private
router.get('/my', authMiddleware, productController.getMyProducts);


// @route   POST /api/products
// @desc    Add a new product (Private)
// @access  Private
router.post(
    '/', 
    authMiddleware, 
    uploadMultiple, 
    productController.addProduct
);

// @route   PUT /api/products/:id
// @desc    Update a specific product (Private - Creator Only)
// @access  Private
// Uses uploadMultiple in case the user wants to add more images during an update
router.put(
    '/:id', 
    authMiddleware, 
    uploadMultiple, // Use the same middleware to handle optional new image uploads
    productController.updateProduct
);

// @route   DELETE /api/products/:id
// @desc    Delete a specific product (Private - Creator Only)
// @access  Private
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
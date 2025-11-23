const Product = require('../models/Product');
// Assuming cloudinary is imported and configured correctly
const { cloudinary } = require('../utils/cloudinaryConfig'); 
const mongoose = require('mongoose');

// Helper function to get authenticated user's ID
const getUserId = (req) => req.user.id;

// --- CREATE (from previous response) ---
// @route   POST /api/products
// @desc    Add a new product
// @access  Private (Requires JWT)
exports.addProduct = async (req, res) => {
    const userId = getUserId(req);
    const { name, description, price, quantity } = req.body;
    const images = req.files; 
    
    if (!images || images.length === 0) {
        return res.status(400).json({ msg: 'Please upload at least one product image' });
    }

    try {
        const imageDetails = images.map(file => ({
            url: file.path,       
            cloudinaryId: file.filename 
        }));

        const newProduct = new Product({
            userId,
            name,
            description,
            price,
            quantity,
            images: imageDetails 
        });

        const product = await newProduct.save();

        res.status(201).json({ 
            msg: 'Product added successfully', 
            product 
        });

    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ errors: Object.values(err.errors).map(e => e.message) });
        }
        
        // Cleanup orphaned files on DB error
        if (req.files && req.files.length > 0) {
            const deletePromises = req.files.map(file => 
                cloudinary.uploader.destroy(file.filename)
            );
            await Promise.all(deletePromises).catch(deleteErr => console.error('Failed to delete orphaned files:', deleteErr.message));
        }

        res.status(500).send('Server Error');
    }
};

// --- READ ALL ---
// @route   GET /api/products
// @desc    Get all products (public listing)
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        // Find all products and sort by creation date (newest first)
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- READ USER'S PRODUCTS ---
// @route   GET /api/products/my
// @desc    Get all products created by the authenticated user
// @access  Private (Requires JWT)
exports.getMyProducts = async (req, res) => {
    try {
        // Use the authenticated userId to filter products
        const products = await Product.find({ userId: getUserId(req) }).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- UPDATE ---
// @route   PUT /api/products/:id
// @desc    Update a specific product (Only creator can update)
// @access  Private (Requires JWT)
exports.updateProduct = async (req, res) => {
    const userId = getUserId(req);
    const productId = req.params.id;
    const { name, description, price, quantity } = req.body;
    const newImages = req.files || [];

    // Check for valid product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ msg: 'Invalid Product ID format' });
    }

    try {
        let product = await Product.findById(productId);

        if (!product) {
            // Cleanup any newly uploaded images if product isn't found
            const deletePromises = newImages.map(file => cloudinary.uploader.destroy(file.filename));
            
            await Promise.all(deletePromises).catch(deleteErr => console.error('Failed to cleanup on 404:', deleteErr.message));
            return res.status(404).json({ msg: 'Product not found' });
        }

        // Check ownership
        if (product.userId.toString() !== userId) {
            // Cleanup any newly uploaded images if user is unauthorized
            const deletePromises = newImages.map(file => cloudinary.uploader.destroy(file.filename));
            await Promise.all(deletePromises).catch(deleteErr => console.error('Failed to cleanup on 401:', deleteErr.message));
            return res.status(401).json({ msg: 'User not authorized to update this product' });
        }

        // 1. Update text fields
        const updateFields = {};
        if (name) updateFields.name = name;
        if (description) updateFields.description = description;
        if (price) updateFields.price = price;
        if (quantity) updateFields.quantity = quantity;

        // 2. Handle new images (append to existing array)
        if (newImages.length > 0) {
            const newImageDetails = newImages.map(file => ({
                url: file.path,
                cloudinaryId: file.filename 
            }));
            
            // Append new images to the product's image array
            // Use $push with $each for array operations
            if (!updateFields.$push) updateFields.$push = {};
            updateFields.$push.images = { $each: newImageDetails };
        }


        // 3. Perform the update
        product = await Product.findOneAndUpdate(
            { _id: productId },
            updateFields,
            { new: true, runValidators: true }
        );

        res.json({ msg: 'Product updated successfully', product });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- DELETE ---
// @route   DELETE /api/products/:id
// @desc    Delete a specific product (Only creator can delete)
// @access  Private (Requires JWT)
exports.deleteProduct = async (req, res) => {
    const userId = getUserId(req);
    const productId = req.params.id;

    // Check for valid product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ msg: 'Invalid Product ID format' });
    }

    try {
        let product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        // Check ownership
        if (product.userId.toString() !== userId) {
            return res.status(401).json({ msg: 'User not authorized to delete this product' });
        }

        // 1. Delete all associated images from Cloudinary
        const deletePromises = product.images.map(image => 
            cloudinary.uploader.destroy(image.cloudinaryId)
        );

        // Run all deletions concurrently
        await Promise.all(deletePromises)
            .then(() => console.log(`Successfully deleted ${product.images.length} images from Cloudinary`))
            .catch(err => console.error('Warning: Failed to delete some images from Cloudinary:', err.message));
            
        // 2. Delete the product document from MongoDB
        await Product.findOneAndDelete({ _id: productId });

        res.json({ msg: 'Product deleted successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
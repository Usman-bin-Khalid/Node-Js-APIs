const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { upload } = require('../utils/cloudinaryConfig');
// --- IMPORT NEW AUTH MIDDLEWARE ---
const authMiddleware = require('../middleware/authMiddleware'); 

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', authMiddleware, profileController.getProfile);

// @route   POST /api/profile
// @desc    Update user profile (with file upload support)
// @access  Private
router.post(
    '/', 
    authMiddleware, 
    upload.single('profileImage'), // This middleware handles the file upload named 'profileImage'
    profileController.updateProfile
);

module.exports = router;
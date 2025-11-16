const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Define the POST route for user sign-up
// POST /api/auth/signup
router.post('/signup', authController.signupUser);

module.exports = router;
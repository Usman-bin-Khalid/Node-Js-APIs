const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

// Helper function to generate an Access Token
const generateAccessToken = (user) => {
    // Access tokens are short-lived (e.g., 15 minutes) for resource protection
    return jwt.sign(
        { id: user._id, email: user.email }, // Payload containing user ID and email
        process.env.JWT_SECRET, // Secret key from .env
        { expiresIn: '15m' } // Token expiration time
    );
};

// Helper function to generate a Refresh Token
const generateRefreshToken = (user) => {
    // Refresh tokens are long-lived (e.g., 7 days) to obtain new access tokens
    return jwt.sign(
        { id: user._id, email: user.email }, // Payload
        process.env.REFRESH_TOKEN_SECRET, // Different secret for refresh token
        { expiresIn: '7d' } // Longer expiration time
    );
};

// Controller function for handling user sign-up
exports.signupUser = async (req, res) => {
    // 1. Destructure all fields from the request body
    const { name, email, password, dob, phoneNumber, interests } = req.body;

    try {
        // 2. Check if a user with the provided email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email address.' 
            });
        }

        // 3. Hash the Password
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create a new User instance
        const newUser = new User({
            name,
            email,
            password: hashedPassword, // Store the HASHED password
            dob,
            phoneNumber,
            interests: interests || [], // Use provided interests or an empty array
        });

        // 5. Save the user to the database
        await newUser.save();

        // 6. Success Response
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User registered successfully!',
            user: userResponse
        });

    } catch (error) {
        // 7. Error Handling
        console.error('Sign-up Error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: messages 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration.',
            error: error.message
        });
    }
};

// Controller function for handling user login
exports.loginUser = async (req, res) => {
    // Only email and password are required for login
    const { email, password } = req.body;

    try {
        // 1. Find the user by email
        const user = await User.findOne({ email });
        
        // Check if user exists
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication failed: Invalid email or password.' 
            });
        }

        // 2. Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication failed: Invalid email or password.' 
            });
        }

        // 3. Generate JWT Tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // 4. Success Response: Send tokens back to the client
        res.status(200).json({
            success: true,
            message: 'Login successful!',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login.',
            error: error.message
        });
    }
};
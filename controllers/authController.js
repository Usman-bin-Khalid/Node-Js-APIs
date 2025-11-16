const User = require('../models/User');
const bcrypt = require('bcryptjs');

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
        // Generate a salt (random string) with 10 rounds for security
        const salt = await bcrypt.genSalt(10); 
        // Hash the plain-text password using the salt
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
        // Remove the password field from the response object for security
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

        // Check for Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed', 
                errors: messages 
            });
        }
        
        // Handle other server errors
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration.',
            error: error.message
        });
    }
};
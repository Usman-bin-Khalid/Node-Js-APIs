const Profile = require('../models/Profile');
const { cloudinary } = require('../utils/cloudinaryConfig'); // Import the cloudinary object

// Assumes your authMiddleware adds req.user = { id: '...' }
// This is the ID of the authenticated user
const getUserId = (req) => req.user.id;

// @route   GET /api/profile
// @desc    Get current user's profile
// @access  Private (Requires JWT)
exports.getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: getUserId(req) });

        if (!profile) {
            // If profile doesn't exist, create a new one with defaults
            const newProfile = await Profile.create({ userId: getUserId(req) });
            return res.status(200).json(newProfile);
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @route   PUT /api/profile
// @desc    Update current user's profile, including image upload
// @access  Private (Requires JWT)
exports.updateProfile = async (req, res) => {
    const userId = getUserId(req);
    const { fullName, phoneNumber, location, interests } = req.body;
    let profileFields = {};
    
    // Build profile data fields from the request body
    if (fullName) profileFields.fullName = fullName;
    if (phoneNumber) profileFields.phoneNumber = phoneNumber;
    if (location) profileFields.location = location;

    // Interests should be handled as an array, potentially comma-separated string from form-data
    if (interests) {
        // Handle interests array: split comma-separated strings if needed
        if (Array.isArray(interests)) {
             profileFields.interests = interests;
        } else if (typeof interests === 'string') {
             profileFields.interests = interests.split(',').map(item => item.trim());
        }
    }

    try {
        let profile = await Profile.findOne({ userId });

        if (!profile) {
            // If the profile document doesn't exist, create it.
            profile = new Profile({ userId, ...profileFields });
        }

        // --- Handle File Upload/Update Logic ---
        if (req.file) {
            // 1. Check if an old image exists and delete it from Cloudinary
            if (profile.cloudinaryId) {
                await cloudinary.uploader.destroy(profile.cloudinaryId);
            }
            
            // 2. Update the profile fields with the new Cloudinary data
            profileFields.profileImage = req.file.path; // The secure_url from Cloudinary
            profileFields.cloudinaryId = req.file.filename; // The public_id
        }

        // 3. Update or save the profile document
        profile = await Profile.findOneAndUpdate(
            { userId },
            { $set: profileFields },
            { new: true, upsert: true, runValidators: true } // 'new: true' returns updated document, 'upsert: true' creates it if not found
        );

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        // If Cloudinary upload failed, the file property won't exist in req.file.
        // If the deletion or update failed, it's a server error.
        res.status(500).send('Server Error');
    }


    
};

exports.deleteProfile = async (req, res) => {
    try {
        const userId = getUserId(req);

        // 1. Find the user's profile
        const profile = await Profile.findOne({ userId });

        if (!profile) {
            return res.status(404).json({ msg: "Profile not found" });
        }

        // 2. Delete image from Cloudinary if exists
        if (profile.cloudinaryId) {
            try {
                await cloudinary.uploader.destroy(profile.cloudinaryId);
            } catch (err) {
                console.log("Cloudinary delete error:", err.message);
            }
        }

        // 3. Delete the profile from MongoDB
        await Profile.findOneAndDelete({ userId });

        res.json({ msg: "Profile deleted successfully" });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};


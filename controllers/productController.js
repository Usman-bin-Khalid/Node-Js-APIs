const Product = require('../models/Product');
// Import utility functions for file handling and Cloudinary
// Ensure your file upload middleware (like Multer) is configured to handle multiple files
// and that it sets the uploaded file details in req.files (an array).

// Assuming you have the cloudinary instance available from a config file
const { cloudinary } = require('../utils/cloudinaryConfig'); 

// Helper function to get authenticated user's ID
const getUserId = (req) => req.user.id;

// @route   POST /api/products
// @desc    Add a new product
// @access  Private (Requires JWT)
exports.addProduct = async (req, res) => {
    const userId = getUserId(req);
    const { name, description, price, quantity } = req.body;

    // The file upload middleware (e.g., Multer + Cloudinary storage)
    // must populate req.files with an array of uploaded image details.
    const images = req.files; 
    
    // Basic validation check for images
    if (!images || images.length === 0) {
        return res.status(400).json({ msg: 'Please upload at least one product image' });
    }

    try {
        // Prepare the image data for saving in MongoDB
        const imageDetails = images.map(file => ({
            url: file.path,       // The secure_url from Cloudinary (path is common in Multer results)
            cloudinaryId: file.filename // The public_id from Cloudinary (filename is common in Multer results)
        }));

        const newProduct = new Product({
            userId,
            name,
            description,
            price,
            quantity,
            images: imageDetails // Assign the array of image details
        });

        const product = await newProduct.save();

        res.status(201).json({ 
            msg: 'Product added successfully', 
            product 
        });

    } catch (err) {
        console.error(err.message);

        // If a MongoDB validation error occurs (e.g., missing required field)
        if (err.name === 'ValidationError') {
            return res.status(400).json({ errors: Object.values(err.errors).map(e => e.message) });
        }
        
        // IMPORTANT: If product saving failed, we must delete the already uploaded images from Cloudinary.
        if (req.files && req.files.length > 0) {
            // Delete all uploaded images in case of a database save failure
            const deletePromises = req.files.map(file => 
                cloudinary.uploader.destroy(file.filename)
            );
            await Promise.all(deletePromises)
                .then(() => console.log('Successfully deleted orphaned files from Cloudinary'))
                .catch(deleteErr => console.error('Failed to delete orphaned files from Cloudinary:', deleteErr.message));
        }

        res.status(500).send('Server Error');
    }
};

// You can add getProduct, updateProduct, deleteProduct functions here as well.
// For a complete API, you would need a 'deleteProduct' function that also deletes all 
// associated images from Cloudinary using their 'cloudinaryId's.
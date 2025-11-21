// Example in a file like utils/upload.js or in your main server file
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary'); 
const { cloudinary } = require('./cloudinaryConfig'); // Your Cloudinary config file

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'product_images', // Specify a folder in Cloudinary
        allowedFormats: ['jpeg', 'png', 'jpg'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    },
});

// Configure Multer
// 'images' is the field name used in the form-data
const uploadMultiple = multer({ storage: storage }).array('images', 5); // Allow up to 5 images

module.exports = { uploadMultiple };
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { upload } = require('../utils/cloudinaryConfig');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile APIs
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 */
router.get('/', authMiddleware, profileController.getProfile);

/**
 * @swagger
 * /api/profile:
 *   post:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.post('/', authMiddleware, upload.single('profileImage'), profileController.updateProfile);

/**
 * @swagger
 * /api/profile:
 *   delete:
 *     summary: Delete user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted
 */
router.delete('/', authMiddleware, profileController.deleteProfile);

module.exports = router;

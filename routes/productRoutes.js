const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../utils/upload');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product CRUD APIs
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products (public)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', productController.getProducts);

/**
 * @swagger
 * /api/products/my:
 *   get:
 *     summary: Get authenticated user's products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user products
 */
router.get('/my', authMiddleware, productController.getMyProducts);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post('/', authMiddleware, uploadMultiple, productController.addProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/:id', authMiddleware, uploadMultiple, productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: Product deleted
 */
router.delete('/:id', authMiddleware, productController.deleteProduct);

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   post:
 *     summary: Add a review to product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review added
 */
router.post('/:id/reviews', authMiddleware, productController.createProductReview);

module.exports = router;

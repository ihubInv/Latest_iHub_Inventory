const express = require('express');
const {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  getActiveAssets,
  getAssetsByCategory,
  getAssetsWithInventory,
  searchAssets,
  getAssetInventorySummary,
  toggleAssetActive,
  addTag,
  removeTag,
  getAssetStats
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/auth');
const { validateAsset, validateObjectId, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Get all assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: isactive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: name
 *         description: Sort field and direction
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/assets:
 *   post:
 *     summary: Create new asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dell Laptop
 *               description:
 *                 type: string
 *                 example: High-performance laptop for development
 *               category:
 *                 type: string
 *                 example: 64f7b3b3b3b3b3b3b3b3b3b3
 *               manufacturer:
 *                 type: string
 *                 example: Dell Technologies
 *               model:
 *                 type: string
 *                 example: Inspiron 15 3000
 *               specifications:
 *                 type: object
 *                 properties:
 *                   processor:
 *                     type: string
 *                     example: Intel Core i5
 *                   memory:
 *                     type: string
 *                     example: 8GB RAM
 *                   storage:
 *                     type: string
 *                     example: 256GB SSD
 *                   display:
 *                     type: string
 *                     example: 15.6 inch HD
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [laptop, development, portable]
 *               isactive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Asset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', authorize('admin', 'stock-manager'), validateAsset, createAsset);

/**
 * @swagger
 * /api/assets/active:
 *   get:
 *     summary: Get active assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/active', getActiveAssets);

/**
 * @swagger
 * /api/assets/with-inventory:
 *   get:
 *     summary: Get assets with inventory items
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assets with inventory retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 15
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Asset'
 *                       - type: object
 *                         properties:
 *                           inventoryCount:
 *                             type: number
 *                             example: 5
 *                           totalQuantity:
 *                             type: number
 *                             example: 20
 *                           totalValue:
 *                             type: number
 *                             example: 900000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/with-inventory', getAssetsWithInventory);

/**
 * @swagger
 * /api/assets/search:
 *   get:
 *     summary: Search assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum results to return
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/search', validateSearch, searchAssets);

/**
 * @swagger
 * /api/assets/stats:
 *   get:
 *     summary: Get asset statistics
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalAssets:
 *                       type: number
 *                       example: 50
 *                     activeAssets:
 *                       type: number
 *                       example: 45
 *                     assetsWithInventory:
 *                       type: number
 *                       example: 30
 *                     byCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 64f7b3b3b3b3b3b3b3b3b3b3
 *                           categoryName:
 *                             type: string
 *                             example: IT Equipment
 *                           count:
 *                             type: number
 *                             example: 20
 *                     byManufacturer:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: Dell Technologies
 *                           count:
 *                             type: number
 *                             example: 15
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/stats', getAssetStats);

/**
 * @swagger
 * /api/assets/category/{categoryId}:
 *   get:
 *     summary: Get assets by category
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/category/:categoryId', validateObjectId('categoryId'), getAssetsByCategory);

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get single asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     summary: Update asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dell Laptop Updated
 *               description:
 *                 type: string
 *                 example: Updated high-performance laptop
 *               category:
 *                 type: string
 *                 example: 64f7b3b3b3b3b3b3b3b3b3b3
 *               manufacturer:
 *                 type: string
 *                 example: Dell Technologies
 *               model:
 *                 type: string
 *                 example: Inspiron 15 3000
 *               specifications:
 *                 type: object
 *                 properties:
 *                   processor:
 *                     type: string
 *                     example: Intel Core i7
 *                   memory:
 *                     type: string
 *                     example: 16GB RAM
 *                   storage:
 *                     type: string
 *                     example: 512GB SSD
 *                   display:
 *                     type: string
 *                     example: 15.6 inch FHD
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [laptop, development, portable, updated]
 *               isactive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     summary: Delete asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Cannot delete asset with associated inventory items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', validateObjectId('id'), getAsset);
router.put('/:id', authorize('admin', 'stock-manager'), validateObjectId('id'), updateAsset);
router.delete('/:id', authorize('admin'), validateObjectId('id'), deleteAsset);

/**
 * @swagger
 * /api/assets/{id}/inventory-summary:
 *   get:
 *     summary: Get asset inventory summary
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Inventory summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     asset:
 *                       $ref: '#/components/schemas/Asset'
 *                     inventorySummary:
 *                       type: object
 *                       properties:
 *                         totalItems:
 *                           type: number
 *                           example: 5
 *                         totalQuantity:
 *                           type: number
 *                           example: 20
 *                         availableQuantity:
 *                           type: number
 *                           example: 15
 *                         issuedQuantity:
 *                           type: number
 *                           example: 5
 *                         totalValue:
 *                           type: number
 *                           example: 900000
 *                         averageCost:
 *                           type: number
 *                           example: 45000
 *                         byStatus:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: available
 *                               count:
 *                                 type: number
 *                                 example: 3
 *                               quantity:
 *                                 type: number
 *                                 example: 15
 *                               value:
 *                                 type: number
 *                                 example: 675000
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/inventory-summary', validateObjectId('id'), getAssetInventorySummary);

// Public routes (for all authenticated users)
router.get('/', validatePagination, validateSearch, getAssets);

/**
 * @swagger
 * /api/assets/{id}/toggle-active:
 *   put:
 *     summary: Toggle asset active status
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     responses:
 *       200:
 *         description: Asset status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Asset status toggled successfully
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id/toggle-active', authorize('admin', 'stock-manager'), validateObjectId('id'), toggleAssetActive);

/**
 * @swagger
 * /api/assets/{id}/tags:
 *   post:
 *     summary: Add tag to asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tag
 *             properties:
 *               tag:
 *                 type: string
 *                 example: gaming
 *     responses:
 *       200:
 *         description: Tag added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tag added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         description: Tag already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:id/tags', authorize('admin', 'stock-manager'), validateObjectId('id'), addTag);

/**
 * @swagger
 * /api/assets/{id}/tags/{tag}:
 *   delete:
 *     summary: Remove tag from asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *       - in: path
 *         name: tag
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag to remove
 *     responses:
 *       200:
 *         description: Tag removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tag removed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         description: Tag not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id/tags/:tag', authorize('admin', 'stock-manager'), validateObjectId('id'), removeTag);

module.exports = router;

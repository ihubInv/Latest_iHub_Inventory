const express = require('express');
const {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  issueInventoryItem,
  returnInventoryItem,
  getAvailableInventoryItems,
  getLowStockItems,
  getIssuedItems,
  getInventoryStats,
  getInventoryTransactions,
  bulkUpdateInventoryItems,
  getAvailableAssetNames
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');
const { validateInventoryItem, validateObjectId, validatePagination, validateSearch, validateDateRange } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, issued, maintenance, retired]
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Sort field and direction
 *     responses:
 *       200:
 *         description: Inventory items retrieved successfully
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
 * /api/inventory/available:
 *   get:
 *     summary: Get available inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available items retrieved successfully
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
 *                     $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/available', getAvailableInventoryItems);

/**
 * @swagger
 * /api/inventory/available-asset-names:
 *   get:
 *     summary: Get available asset names (excluding pending/approved requests)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available asset names retrieved successfully
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
 *                     type: string
 *                   example: ["Laptop", "Monitor", "Keyboard"]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/available-asset-names', getAvailableAssetNames);

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock items retrieved successfully
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
 *                     $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/low-stock', getLowStockItems);

/**
 * @swagger
 * /api/inventory/issued:
 *   get:
 *     summary: Get issued items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Issued items retrieved successfully
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
 *                     $ref: '#/components/schemas/InventoryItem'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/issued', getIssuedItems);

/**
 * @swagger
 * /api/inventory/stats:
 *   get:
 *     summary: Get inventory statistics
 *     tags: [Inventory]
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
 *                     totalItems:
 *                       type: number
 *                       example: 100
 *                     totalValue:
 *                       type: number
 *                       example: 5000000
 *                     lowStockCount:
 *                       type: number
 *                       example: 5
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: available
 *                           count:
 *                             type: number
 *                             example: 80
 *                           totalValue:
 *                             type: number
 *                             example: 4000000
 *                           totalQuantity:
 *                             type: number
 *                             example: 80
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/stats', getInventoryStats);

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get single inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InventoryItem'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', validateObjectId('id'), getInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}/transactions:
 *   get:
 *     summary: Get inventory item transactions
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
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
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                 total:
 *                   type: number
 *                   example: 20
 *                 page:
 *                   type: number
 *                   example: 1
 *                 pages:
 *                   type: number
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryTransaction'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/transactions', validateObjectId('id'), validatePagination, getInventoryTransactions);

// Public routes (for all authenticated users)
router.get('/', validatePagination, validateSearch, getInventoryItems);

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Create new inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uniqueid
 *               - assetname
 *               - vendorname
 *               - quantityperitem
 *               - rateinclusivetax
 *               - totalcost
 *               - locationofitem
 *             properties:
 *               uniqueid:
 *                 type: string
 *                 example: IT-LAP-001
 *               financialyear:
 *                 type: string
 *                 example: 2024-25
 *               assetcategory:
 *                 type: string
 *                 example: Laptop
 *               assetcategoryid:
 *                 type: string
 *                 example: 64f7b3b3b3b3b3b3b3b3b3b3
 *               assetid:
 *                 type: string
 *                 example: 64f7b3b3b3b3b3b3b3b3b3b3
 *               assetname:
 *                 type: string
 *                 example: Dell Laptop
 *               specification:
 *                 type: string
 *                 example: Intel i5, 8GB RAM, 256GB SSD
 *               makemodel:
 *                 type: string
 *                 example: Dell Inspiron 15 3000
 *               productserialnumber:
 *                 type: string
 *                 example: DL123456789
 *               vendorname:
 *                 type: string
 *                 example: Dell Technologies
 *               quantityperitem:
 *                 type: number
 *                 example: 1
 *               rateinclusivetax:
 *                 type: number
 *                 example: 45000
 *               totalcost:
 *                 type: number
 *                 example: 45000
 *               locationofitem:
 *                 type: string
 *                 example: IT Equipment Room
 *               locationid:
 *                 type: string
 *                 example: 64f7b3b3b3b3b3b3b3b3b3b3
 *               balancequantityinstock:
 *                 type: number
 *                 example: 5
 *               description:
 *                 type: string
 *                 example: Laptop for development work
 *               unitofmeasurement:
 *                 type: string
 *                 example: Pieces
 *               conditionofasset:
 *                 type: string
 *                 enum: [excellent, good, fair, poor, damaged]
 *                 example: excellent
 *               minimumstocklevel:
 *                 type: number
 *                 example: 2
 *               dateofinvoice:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *               dateofentry:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-16
 *               invoicenumber:
 *                 type: string
 *                 example: INV-2024-001
 *     responses:
 *       201:
 *         description: Inventory item created successfully
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
router.post('/', authorize('admin', 'stock-manager'), validateInventoryItem, createInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assetname:
 *                 type: string
 *                 example: Dell Laptop Updated
 *               specification:
 *                 type: string
 *                 example: Intel i7, 16GB RAM, 512GB SSD
 *               balancequantityinstock:
 *                 type: number
 *                 example: 10
 *               conditionofasset:
 *                 type: string
 *                 enum: [excellent, good, fair, poor, damaged]
 *                 example: excellent
 *               status:
 *                 type: string
 *                 enum: [available, issued, maintenance, retired]
 *                 example: available
 *               locationofitem:
 *                 type: string
 *                 example: IT Equipment Room
 *               locationid:
 *                 type: string
 *                 example: 64f7b3b3b3b3b3b3b3b3b3b3
 *               description:
 *                 type: string
 *                 example: Updated laptop for development work
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
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
 */
router.put('/:id', authorize('admin', 'stock-manager'), validateObjectId('id'), updateInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Cannot delete item that is currently issued
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
router.delete('/:id', authorize('admin', 'stock-manager'), validateObjectId('id'), deleteInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}/issue:
 *   post:
 *     summary: Issue inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - issuedTo
 *             properties:
 *               issuedTo:
 *                 type: string
 *                 example: John Doe
 *               expectedReturnDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-12-31
 *               purpose:
 *                 type: string
 *                 example: Development work
 *               notes:
 *                 type: string
 *                 example: Item issued to employee for project work
 *     responses:
 *       200:
 *         description: Item issued successfully
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
 *                   example: Item issued successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     item:
 *                       $ref: '#/components/schemas/InventoryItem'
 *                     transaction:
 *                       $ref: '#/components/schemas/InventoryTransaction'
 *       400:
 *         description: Item is out of stock or already issued
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
router.post('/:id/issue', authorize('admin', 'stock-manager'), validateObjectId('id'), issueInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}/return:
 *   post:
 *     summary: Return inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: Item returned in good condition
 *               condition:
 *                 type: string
 *                 enum: [excellent, good, fair, poor, damaged]
 *                 example: excellent
 *     responses:
 *       200:
 *         description: Item returned successfully
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
 *                   example: Item returned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     item:
 *                       $ref: '#/components/schemas/InventoryItem'
 *                     transaction:
 *                       $ref: '#/components/schemas/InventoryTransaction'
 *       400:
 *         description: Item is not currently issued
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
router.post('/:id/return', authorize('admin', 'stock-manager'), validateObjectId('id'), returnInventoryItem);

/**
 * @swagger
 * /api/inventory/bulk-update:
 *   put:
 *     summary: Bulk update inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - updates
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64f7b3b3b3b3b3b3b3b3b3b3", "64f7b3b3b3b3b3b3b3b3b3b4"]
 *               updates:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [available, issued, maintenance, retired]
 *                     example: available
 *                   conditionofasset:
 *                     type: string
 *                     enum: [excellent, good, fair, poor, damaged]
 *                     example: excellent
 *                   locationofitem:
 *                     type: string
 *                     example: Storage Room A
 *     responses:
 *       200:
 *         description: Items updated successfully
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
 *                   example: Updated 2 items successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: number
 *                       example: 2
 *                     errorCount:
 *                       type: number
 *                       example: 0
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InventoryItem'
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           itemId:
 *                             type: string
 *                           error:
 *                             type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/bulk-update', authorize('admin', 'stock-manager'), bulkUpdateInventoryItems);

module.exports = router;

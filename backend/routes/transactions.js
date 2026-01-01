const express = require('express');
const {
  getTransactions,
  getTransaction,
  getTransactionsByItem,
  getTransactionsByUser,
  getOverdueTransactions,
  getPendingTransactions,
  getTransactionStats,
  getMonthlyReport,
  approveTransaction,
  cancelTransaction,
  completeTransaction,
  returnItemFromTransaction,
  getAuditTrail
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination, validateDateRange } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Transactions]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [issue, return, adjustment, purchase, disposal, maintenance]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Sort field and direction
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/transactions/stats:
 *   get:
 *     summary: Get transaction statistics
 *     tags: [Transactions]
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
 *                     totalTransactions:
 *                       type: number
 *                       example: 500
 *                     pendingTransactions:
 *                       type: number
 *                       example: 25
 *                     completedTransactions:
 *                       type: number
 *                       example: 450
 *                     cancelledTransactions:
 *                       type: number
 *                       example: 25
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: issue
 *                           count:
 *                             type: number
 *                             example: 200
 *                           totalValue:
 *                             type: number
 *                             example: 2000000
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: completed
 *                           count:
 *                             type: number
 *                             example: 450
 *                     monthlyTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: 2024-01
 *                           count:
 *                             type: number
 *                             example: 50
 *                           totalValue:
 *                             type: number
 *                             example: 500000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/stats', getTransactionStats);

/**
 * @swagger
 * /api/transactions/audit-trail:
 *   get:
 *     summary: Get audit trail
 *     tags: [Transactions]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Audit trail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/audit-trail', validatePagination, validateDateRange, getAuditTrail);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get single transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InventoryTransaction'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', validateObjectId('id'), getTransaction);

/**
 * @swagger
 * /api/transactions/overdue:
 *   get:
 *     summary: Get overdue transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue transactions retrieved successfully
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
 *                     $ref: '#/components/schemas/InventoryTransaction'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/overdue', authorize('admin', 'stock-manager'), getOverdueTransactions);

/**
 * @swagger
 * /api/transactions/pending:
 *   get:
 *     summary: Get pending transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending transactions retrieved successfully
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
 *                     $ref: '#/components/schemas/InventoryTransaction'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/pending', authorize('admin', 'stock-manager'), getPendingTransactions);

/**
 * @swagger
 * /api/transactions/monthly-report:
 *   get:
 *     summary: Get monthly transaction report
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: date
 *         description: Month for report (YYYY-MM format)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year for report
 *     responses:
 *       200:
 *         description: Monthly report retrieved successfully
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
 *                     month:
 *                       type: string
 *                       example: 2024-01
 *                     totalTransactions:
 *                       type: number
 *                       example: 50
 *                     totalValue:
 *                       type: number
 *                       example: 500000
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: issue
 *                           count:
 *                             type: number
 *                             example: 30
 *                           value:
 *                             type: number
 *                             example: 300000
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             example: completed
 *                           count:
 *                             type: number
 *                             example: 45
 *                     dailyBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: 2024-01-15
 *                           count:
 *                             type: number
 *                             example: 5
 *                           value:
 *                             type: number
 *                             example: 50000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/monthly-report', authorize('admin', 'stock-manager'), getMonthlyReport);

/**
 * @swagger
 * /api/transactions/item/{itemId}:
 *   get:
 *     summary: Get transactions by inventory item
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *         description: Item transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/item/:itemId', authorize('admin', 'stock-manager'), validateObjectId('itemId'), validatePagination, getTransactionsByItem);

/**
 * @swagger
 * /api/transactions/user/{userId}:
 *   get:
 *     summary: Get transactions by user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *         description: User transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/user/:userId', validateObjectId('userId'), validatePagination, (req, res, next) => {
  // Allow employees to only access their own transactions
  if (req.user.role === 'employee' && req.params.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own transactions'
    });
  }
  // Allow admin and stock-manager to access any user's transactions
  getTransactionsByUser(req, res, next);
});

/**
 * @swagger
 * /api/transactions/{id}/approve:
 *   put:
 *     summary: Approve transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *                 example: Transaction approved for project work
 *     responses:
 *       200:
 *         description: Transaction approved successfully
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
 *                   example: Transaction approved successfully
 *                 data:
 *                   $ref: '#/components/schemas/InventoryTransaction'
 *       400:
 *         description: Transaction already processed
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
router.put('/:id/approve', authorize('admin', 'stock-manager'), validateObjectId('id'), approveTransaction);

/**
 * @swagger
 * /api/transactions/{id}/cancel:
 *   put:
 *     summary: Cancel transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Item no longer needed
 *               remarks:
 *                 type: string
 *                 example: Cancelled due to project changes
 *     responses:
 *       200:
 *         description: Transaction cancelled successfully
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
 *                   example: Transaction cancelled successfully
 *                 data:
 *                   $ref: '#/components/schemas/InventoryTransaction'
 *       400:
 *         description: Transaction already processed
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
router.put('/:id/cancel', authorize('admin', 'stock-manager'), validateObjectId('id'), cancelTransaction);

/**
 * @swagger
 * /api/transactions/{id}/complete:
 *   put:
 *     summary: Complete transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *                 example: Transaction completed successfully
 *     responses:
 *       200:
 *         description: Transaction completed successfully
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
 *                   example: Transaction completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/InventoryTransaction'
 *       400:
 *         description: Transaction not in approved status
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
router.put('/:id/complete', authorize('admin', 'stock-manager'), validateObjectId('id'), completeTransaction);

/**
 * @swagger
 * /api/transactions/{id}/return:
 *   post:
 *     summary: Return item from transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - returnDate
 *             properties:
 *               returnDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-12-31
 *               condition:
 *                 type: string
 *                 enum: [excellent, good, fair, poor, damaged]
 *                 example: excellent
 *               remarks:
 *                 type: string
 *                 example: Item returned in good condition
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
 *                     transaction:
 *                       $ref: '#/components/schemas/InventoryTransaction'
 *                     inventoryItem:
 *                       $ref: '#/components/schemas/InventoryItem'
 *       400:
 *         description: Transaction not in completed status
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
router.post('/:id/return', authorize('admin', 'stock-manager'), validateObjectId('id'), returnItemFromTransaction);

// Admin and Stock Manager routes
router.get('/', authorize('admin', 'stock-manager'), validatePagination, validateDateRange, getTransactions);

module.exports = router;

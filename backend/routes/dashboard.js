const express = require('express');
const {
  getDashboardStats,
  getInventoryOverview,
  getRequestOverview,
  getTransactionOverview,
  getUserActivity
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                       example: 1000
 *                     totalValue:
 *                       type: number
 *                       example: 5000000
 *                     totalUsers:
 *                       type: number
 *                       example: 50
 *                     totalRequests:
 *                       type: number
 *                       example: 200
 *                     totalTransactions:
 *                       type: number
 *                       example: 500
 *                     lowStockItems:
 *                       type: number
 *                       example: 25
 *                     pendingRequests:
 *                       type: number
 *                       example: 15
 *                     overdueItems:
 *                       type: number
 *                       example: 10
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: issue
 *                           description:
 *                             type: string
 *                             example: Laptop issued to John Doe
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-01-15T10:30:00Z
 *                           user:
 *                             type: string
 *                             example: Admin User
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/stats', getDashboardStats);

/**
 * @swagger
 * /api/dashboard/inventory-overview:
 *   get:
 *     summary: Get inventory overview
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory overview retrieved successfully
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
 *                       example: 1000
 *                     totalValue:
 *                       type: number
 *                       example: 5000000
 *                     availableItems:
 *                       type: number
 *                       example: 800
 *                     issuedItems:
 *                       type: number
 *                       example: 150
 *                     maintenanceItems:
 *                       type: number
 *                       example: 30
 *                     retiredItems:
 *                       type: number
 *                       example: 20
 *                     lowStockItems:
 *                       type: number
 *                       example: 25
 *                     byCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: IT Equipment
 *                           count:
 *                             type: number
 *                             example: 200
 *                           value:
 *                             type: number
 *                             example: 1000000
 *                     byLocation:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           location:
 *                             type: string
 *                             example: Storage Room A
 *                           count:
 *                             type: number
 *                             example: 100
 *                           value:
 *                             type: number
 *                             example: 500000
 *                     monthlyTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: 2024-01
 *                           added:
 *                             type: number
 *                             example: 50
 *                           issued:
 *                             type: number
 *                             example: 30
 *                           returned:
 *                             type: number
 *                             example: 25
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/inventory-overview', getInventoryOverview);

/**
 * @swagger
 * /api/dashboard/request-overview:
 *   get:
 *     summary: Get request overview
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Request overview retrieved successfully
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
 *                     totalRequests:
 *                       type: number
 *                       example: 200
 *                     pendingRequests:
 *                       type: number
 *                       example: 15
 *                     approvedRequests:
 *                       type: number
 *                       example: 150
 *                     rejectedRequests:
 *                       type: number
 *                       example: 35
 *                     byPriority:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           priority:
 *                             type: string
 *                             example: high
 *                           count:
 *                             type: number
 *                             example: 50
 *                     byDepartment:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           department:
 *                             type: string
 *                             example: IT
 *                           count:
 *                             type: number
 *                             example: 80
 *                     byItemType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           itemType:
 *                             type: string
 *                             example: Laptop
 *                           count:
 *                             type: number
 *                             example: 60
 *                     monthlyTrends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: 2024-01
 *                           submitted:
 *                             type: number
 *                             example: 20
 *                           approved:
 *                             type: number
 *                             example: 15
 *                           rejected:
 *                             type: number
 *                             example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/request-overview', getRequestOverview);

/**
 * @swagger
 * /api/dashboard/transaction-overview:
 *   get:
 *     summary: Get transaction overview
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction overview retrieved successfully
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
 *                     overdueTransactions:
 *                       type: number
 *                       example: 10
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
 *                             example: 200
 *                           value:
 *                             type: number
 *                             example: 2000000
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
 *                           value:
 *                             type: number
 *                             example: 500000
 *                     topUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user:
 *                             type: string
 *                             example: John Doe
 *                           count:
 *                             type: number
 *                             example: 25
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/transaction-overview', getTransactionOverview);

/**
 * @swagger
 * /api/dashboard/user-activity:
 *   get:
 *     summary: Get user activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of activities to return
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, login, inventory, request, transaction]
 *         description: Filter by activity type
 *     responses:
 *       200:
 *         description: User activity retrieved successfully
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
 *                     recentActivities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: 64f7b3b3b3b3b3b3b3b3b3b3
 *                           type:
 *                             type: string
 *                             example: inventory
 *                           action:
 *                             type: string
 *                             example: issue
 *                           description:
 *                             type: string
 *                             example: Laptop issued to John Doe
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: 64f7b3b3b3b3b3b3b3b3b3b3
 *                               name:
 *                                 type: string
 *                                 example: Admin User
 *                               email:
 *                                 type: string
 *                                 example: admin@ihub.com
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-01-15T10:30:00Z
 *                           metadata:
 *                             type: object
 *                             properties:
 *                               itemId:
 *                                 type: string
 *                                 example: 64f7b3b3b3b3b3b3b3b3b3b3
 *                               itemName:
 *                                 type: string
 *                                 example: Dell Laptop
 *                               quantity:
 *                                 type: number
 *                                 example: 1
 *                     activityStats:
 *                       type: object
 *                       properties:
 *                         totalActivities:
 *                           type: number
 *                           example: 1000
 *                         todayActivities:
 *                           type: number
 *                           example: 25
 *                         byType:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: inventory
 *                               count:
 *                                 type: number
 *                                 example: 400
 *                         byUser:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               user:
 *                                 type: string
 *                                 example: Admin User
 *                               count:
 *                                 type: number
 *                                 example: 100
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/user-activity', getUserActivity);

module.exports = router;

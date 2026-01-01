const express = require('express');
const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationCount,
  getNotificationSettings,
  updateNotificationSettings
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
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
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, warning, error, success]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                 total:
 *                   type: number
 *                   example: 100
 *                 page:
 *                   type: number
 *                   example: 1
 *                 pages:
 *                   type: number
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 64f7b3b3b3b3b3b3b3b3b3b3
 *                       title:
 *                         type: string
 *                         example: Low Stock Alert
 *                       message:
 *                         type: string
 *                         example: Dell Laptop is running low on stock
 *                       type:
 *                         type: string
 *                         enum: [info, warning, error, success]
 *                         example: warning
 *                       isRead:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-15T10:30:00Z
 *                       metadata:
 *                         type: object
 *                         properties:
 *                           itemId:
 *                             type: string
 *                             example: 64f7b3b3b3b3b3b3b3b3b3b3
 *                           itemName:
 *                             type: string
 *                             example: Dell Laptop
 *                           currentStock:
 *                             type: number
 *                             example: 2
 *                           minimumStock:
 *                             type: number
 *                             example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', getNotifications);

/**
 * @swagger
 * /api/notifications/count:
 *   get:
 *     summary: Get notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification count retrieved successfully
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
 *                     total:
 *                       type: number
 *                       example: 100
 *                     unread:
 *                       type: number
 *                       example: 25
 *                     byType:
 *                       type: object
 *                       properties:
 *                         info:
 *                           type: number
 *                           example: 50
 *                         warning:
 *                           type: number
 *                           example: 30
 *                         error:
 *                           type: number
 *                           example: 10
 *                         success:
 *                           type: number
 *                           example: 10
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/count', getNotificationCount);

/**
 * @swagger
 * /api/notifications/settings:
 *   get:
 *     summary: Get notification settings
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
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
 *                     emailNotifications:
 *                       type: boolean
 *                       example: true
 *                     pushNotifications:
 *                       type: boolean
 *                       example: true
 *                     lowStockAlerts:
 *                       type: boolean
 *                       example: true
 *                     requestAlerts:
 *                       type: boolean
 *                       example: true
 *                     transactionAlerts:
 *                       type: boolean
 *                       example: true
 *                     maintenanceAlerts:
 *                       type: boolean
 *                       example: true
 *                     frequency:
 *                       type: string
 *                       enum: [immediate, daily, weekly]
 *                       example: immediate
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     summary: Update notification settings
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *                 example: true
 *               pushNotifications:
 *                 type: boolean
 *                 example: true
 *               lowStockAlerts:
 *                 type: boolean
 *                 example: true
 *               requestAlerts:
 *                 type: boolean
 *                 example: true
 *               transactionAlerts:
 *                 type: boolean
 *                 example: true
 *               maintenanceAlerts:
 *                 type: boolean
 *                 example: true
 *               frequency:
 *                 type: string
 *                 enum: [immediate, daily, weekly]
 *                 example: immediate
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
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
 *                   example: Notification settings updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     emailNotifications:
 *                       type: boolean
 *                       example: true
 *                     pushNotifications:
 *                       type: boolean
 *                       example: true
 *                     lowStockAlerts:
 *                       type: boolean
 *                       example: true
 *                     requestAlerts:
 *                       type: boolean
 *                       example: true
 *                     transactionAlerts:
 *                       type: boolean
 *                       example: true
 *                     maintenanceAlerts:
 *                       type: boolean
 *                       example: true
 *                     frequency:
 *                       type: string
 *                       enum: [immediate, daily, weekly]
 *                       example: immediate
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/settings', getNotificationSettings);
router.put('/settings', updateNotificationSettings);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
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
 *                   example: All notifications marked as read
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: number
 *                       example: 25
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/read-all', markAllNotificationsAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
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
 *                   example: Notification marked as read
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 64f7b3b3b3b3b3b3b3b3b3b3
 *                     title:
 *                       type: string
 *                       example: Low Stock Alert
 *                     message:
 *                       type: string
 *                       example: Dell Laptop is running low on stock
 *                     type:
 *                       type: string
 *                       enum: [info, warning, error, success]
 *                       example: warning
 *                     isRead:
 *                       type: boolean
 *                       example: true
 *                     readAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-15T10:30:00Z
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id/read', validateObjectId('id'), markNotificationAsRead);

module.exports = router;

const express = require('express');
const {
  getRequests,
  getRequest,
  createRequest,
  updateRequest,
  deleteRequest,
  approveRequest,
  rejectRequest,
  getPendingRequests,
  getRequestsByEmployee,
  getOverdueRequests,
  getRequestStats,
  getMyRequests
} = require('../controllers/requestController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get all requests
 *     tags: [Requests]
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
 *           enum: [pending, approved, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -submittedat
 *         description: Sort field and direction
 *     responses:
 *       200:
 *         description: Requests retrieved successfully
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
 * /api/requests:
 *   post:
 *     summary: Create new request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemtype
 *               - quantity
 *               - purpose
 *               - justification
 *             properties:
 *               itemtype:
 *                 type: string
 *                 example: Laptop
 *               quantity:
 *                 type: number
 *                 example: 1
 *               purpose:
 *                 type: string
 *                 example: Development work
 *               justification:
 *                 type: string
 *                 example: Need laptop for new project
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 example: medium
 *               department:
 *                 type: string
 *                 example: IT
 *               project:
 *                 type: string
 *                 example: Website Redesign
 *               expectedreturndate:
 *                 type: string
 *                 format: date
 *                 example: 2024-12-31
 *               estimatedcost:
 *                 type: number
 *                 example: 45000
 *     responses:
 *       201:
 *         description: Request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', createRequest);

/**
 * @swagger
 * /api/requests/my-requests:
 *   get:
 *     summary: Get current user's requests
 *     tags: [Requests]
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
 *     responses:
 *       200:
 *         description: User requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/my-requests', validatePagination, getMyRequests);

/**
 * @swagger
 * /api/requests/stats:
 *   get:
 *     summary: Get request statistics
 *     tags: [Requests]
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
 *                     totalRequests:
 *                       type: number
 *                       example: 100
 *                     pendingRequests:
 *                       type: number
 *                       example: 25
 *                     approvedRequests:
 *                       type: number
 *                       example: 60
 *                     rejectedRequests:
 *                       type: number
 *                       example: 15
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: pending
 *                           count:
 *                             type: number
 *                             example: 25
 *                     byPriority:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: high
 *                           count:
 *                             type: number
 *                             example: 30
 *                     byDepartment:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: IT
 *                           count:
 *                             type: number
 *                             example: 40
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/stats', getRequestStats);

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Get single request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Request'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     summary: Update request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemtype:
 *                 type: string
 *                 example: Laptop
 *               quantity:
 *                 type: number
 *                 example: 2
 *               purpose:
 *                 type: string
 *                 example: Updated development work
 *               justification:
 *                 type: string
 *                 example: Updated justification
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 example: high
 *               department:
 *                 type: string
 *                 example: IT
 *               project:
 *                 type: string
 *                 example: Updated Project
 *               expectedreturndate:
 *                 type: string
 *                 format: date
 *                 example: 2024-12-31
 *               estimatedcost:
 *                 type: number
 *                 example: 50000
 *     responses:
 *       200:
 *         description: Request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     summary: Delete request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Cannot delete approved or rejected request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', validateObjectId('id'), getRequest);
router.put('/:id', validateObjectId('id'), updateRequest);
router.delete('/:id', validateObjectId('id'), deleteRequest);

/**
 * @swagger
 * /api/requests/pending:
 *   get:
 *     summary: Get pending requests
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending requests retrieved successfully
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
 *                     $ref: '#/components/schemas/Request'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/pending', authorize('admin', 'stock-manager'), getPendingRequests);

/**
 * @swagger
 * /api/requests/overdue:
 *   get:
 *     summary: Get overdue requests
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue requests retrieved successfully
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
 *                     $ref: '#/components/schemas/Request'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/overdue', authorize('admin', 'stock-manager'), getOverdueRequests);

/**
 * @swagger
 * /api/requests/employee/{employeeId}:
 *   get:
 *     summary: Get requests by employee
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee requests retrieved successfully
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
 *                     $ref: '#/components/schemas/Request'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/employee/:employeeId', authorize('admin', 'stock-manager'), validateObjectId('employeeId'), getRequestsByEmployee);

/**
 * @swagger
 * /api/requests/{id}/approve:
 *   put:
 *     summary: Approve request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *                 example: Request approved for project work
 *               approvedquantity:
 *                 type: number
 *                 example: 1
 *               inventoryitemid:
 *                 type: string
 *                 example: 64f7b3b3b3b3b3b3b3b3b3b3
 *     responses:
 *       200:
 *         description: Request approved successfully
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
 *                   example: Request approved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     request:
 *                       $ref: '#/components/schemas/Request'
 *                     inventoryItem:
 *                       $ref: '#/components/schemas/InventoryItem'
 *       400:
 *         description: Request already processed or insufficient inventory
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
router.put('/:id/approve', authorize('admin', 'stock-manager'), validateObjectId('id'), approveRequest);

/**
 * @swagger
 * /api/requests/{id}/reject:
 *   put:
 *     summary: Reject request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionreason
 *             properties:
 *               rejectionreason:
 *                 type: string
 *                 example: Insufficient justification provided
 *               remarks:
 *                 type: string
 *                 example: Please provide more details about the project
 *     responses:
 *       200:
 *         description: Request rejected successfully
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
 *                   example: Request rejected successfully
 *                 data:
 *                   $ref: '#/components/schemas/Request'
 *       400:
 *         description: Request already processed
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
router.put('/:id/reject', authorize('admin', 'stock-manager'), validateObjectId('id'), rejectRequest);

// Admin and Stock Manager routes
router.get('/', authorize('admin', 'stock-manager'), validatePagination, validateSearch, getRequests);

module.exports = router;

const express = require('express');
const {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  toggleLocationStatus,
  setDefaultLocation,
  getActiveLocations,
  getLocationsByType,
  getLocationsWithCapacity,
  getDefaultLocation,
  getLocationStats,
  updateLocationOccupancy,
  bulkUpdateLocations
} = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations
 *     tags: [Locations]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: locationType
 *         schema:
 *           type: string
 *           enum: [storage, office, lab, workshop, warehouse, other]
 *         description: Filter by location type
 *       - in: query
 *         name: building
 *         schema:
 *           type: string
 *         description: Filter by building
 *       - in: query
 *         name: floor
 *         schema:
 *           type: string
 *         description: Filter by floor
 *       - in: query
 *         name: accessLevel
 *         schema:
 *           type: string
 *           enum: [public, restricted, private]
 *         description: Filter by access level
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default location
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: name
 *         description: Sort field and direction
 *     responses:
 *       200:
 *         description: Locations retrieved successfully
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
 * /api/locations/active:
 *   get:
 *     summary: Get active locations
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active locations retrieved successfully
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
 *                     $ref: '#/components/schemas/Location'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/active', getActiveLocations);

/**
 * @swagger
 * /api/locations/default:
 *   get:
 *     summary: Get default location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/default', getDefaultLocation);

/**
 * @swagger
 * /api/locations/stats:
 *   get:
 *     summary: Get location statistics
 *     tags: [Locations]
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
 *                     overall:
 *                       type: object
 *                       properties:
 *                         totalLocations:
 *                           type: number
 *                           example: 10
 *                         activeLocations:
 *                           type: number
 *                           example: 8
 *                         totalCapacity:
 *                           type: number
 *                           example: 500
 *                         totalOccupancy:
 *                           type: number
 *                           example: 250
 *                         utilizationPercentage:
 *                           type: number
 *                           example: 50
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: storage
 *                           count:
 *                             type: number
 *                             example: 5
 *                           totalCapacity:
 *                             type: number
 *                             example: 300
 *                           totalOccupancy:
 *                             type: number
 *                             example: 150
 *                           utilizationPercentage:
 *                             type: number
 *                             example: 50
 *                     byBuilding:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: Building A
 *                           count:
 *                             type: number
 *                             example: 3
 *                           totalCapacity:
 *                             type: number
 *                             example: 200
 *                           totalOccupancy:
 *                             type: number
 *                             example: 100
 *                           utilizationPercentage:
 *                             type: number
 *                             example: 50
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/stats', getLocationStats);

/**
 * @swagger
 * /api/locations/available-capacity:
 *   get:
 *     summary: Get locations with available capacity
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Locations with available capacity retrieved successfully
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
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Location'
 *                       - type: object
 *                         properties:
 *                           availableCapacity:
 *                             type: number
 *                             example: 50
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/available-capacity', getLocationsWithCapacity);

/**
 * @swagger
 * /api/locations/type/{type}:
 *   get:
 *     summary: Get locations by type
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [storage, office, lab, workshop, warehouse, other]
 *         description: Location type
 *     responses:
 *       200:
 *         description: Locations retrieved successfully
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
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/type/:type', validateObjectId('type'), getLocationsByType);

/**
 * @swagger
 * /api/locations/{id}:
 *   get:
 *     summary: Get single location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Location'
 *                     - type: object
 *                       properties:
 *                         itemsInLocation:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               uniqueid:
 *                                 type: string
 *                                 example: IT-LAP-001
 *                               assetname:
 *                                 type: string
 *                                 example: Dell Laptop
 *                               balancequantityinstock:
 *                                 type: number
 *                                 example: 5
 *                               status:
 *                                 type: string
 *                                 example: available
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', validateObjectId('id'), getLocation);

// Public routes (for all authenticated users)
router.get('/', validatePagination, validateSearch, getLocations);

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create new location
 *     tags: [Locations]
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
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 example: Storage Room A
 *               description:
 *                 type: string
 *                 example: Main storage room for general inventory
 *               address:
 *                 type: string
 *                 example: Building A, Ground Floor
 *               building:
 *                 type: string
 *                 example: Building A
 *               floor:
 *                 type: string
 *                 example: Ground Floor
 *               capacity:
 *                 type: number
 *                 example: 100
 *               locationType:
 *                 type: string
 *                 enum: [storage, office, lab, workshop, warehouse, other]
 *                 example: storage
 *               accessLevel:
 *                 type: string
 *                 enum: [public, restricted, private]
 *                 example: public
 *               contactPerson:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: IT Manager
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: it@ihub.com
 *                   phone:
 *                     type: string
 *                     example: +91-9876543210
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [main, storage, general]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Location created successfully
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
router.post('/', authorize('admin', 'stock-manager'), createLocation);

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Update location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Storage Room A Updated
 *               description:
 *                 type: string
 *                 example: Updated main storage room
 *               address:
 *                 type: string
 *                 example: Building A, Ground Floor
 *               building:
 *                 type: string
 *                 example: Building A
 *               floor:
 *                 type: string
 *                 example: Ground Floor
 *               capacity:
 *                 type: number
 *                 example: 150
 *               locationType:
 *                 type: string
 *                 enum: [storage, office, lab, workshop, warehouse, other]
 *                 example: storage
 *               accessLevel:
 *                 type: string
 *                 enum: [public, restricted, private]
 *                 example: public
 *               contactPerson:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: IT Manager
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: it@ihub.com
 *                   phone:
 *                     type: string
 *                     example: +91-9876543210
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [main, storage, general, updated]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Location updated successfully
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
 *     summary: Delete location
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Cannot delete location with assigned inventory items
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
router.put('/:id', authorize('admin', 'stock-manager'), validateObjectId('id'), updateLocation);
router.delete('/:id', authorize('admin'), validateObjectId('id'), deleteLocation);

/**
 * @swagger
 * /api/locations/{id}/toggle-status:
 *   patch:
 *     summary: Toggle location status
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location status toggled successfully
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
 *                   example: Location status toggled to active
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id/toggle-status', authorize('admin', 'stock-manager'), validateObjectId('id'), toggleLocationStatus);

/**
 * @swagger
 * /api/locations/{id}/set-default:
 *   patch:
 *     summary: Set location as default
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location set as default successfully
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
 *                   example: Location 'Storage Room A' set as default
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch('/:id/set-default', authorize('admin'), validateObjectId('id'), setDefaultLocation);

/**
 * @swagger
 * /api/locations/{id}/occupancy:
 *   patch:
 *     summary: Update location occupancy
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - quantity
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [increment, decrement]
 *                 example: increment
 *               quantity:
 *                 type: number
 *                 example: 5
 *     responses:
 *       200:
 *         description: Location occupancy updated successfully
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
 *                   example: Location occupancy incremented by 5
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Location'
 *                     - type: object
 *                       properties:
 *                         occupancyPercentage:
 *                           type: number
 *                           example: 60
 *                         availableCapacity:
 *                           type: number
 *                           example: 40
 *                         availabilityStatus:
 *                           type: string
 *                           example: Available
 *       400:
 *         description: Invalid action or quantity, or exceeds capacity
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
router.patch('/:id/occupancy', authorize('admin', 'stock-manager'), validateObjectId('id'), updateLocationOccupancy);

/**
 * @swagger
 * /api/locations/bulk-update:
 *   put:
 *     summary: Bulk update locations
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - locationIds
 *               - updates
 *             properties:
 *               locationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64f7b3b3b3b3b3b3b3b3b3b3", "64f7b3b3b3b3b3b3b3b3b3b4"]
 *               updates:
 *                 type: object
 *                 properties:
 *                   isActive:
 *                     type: boolean
 *                     example: true
 *                   accessLevel:
 *                     type: string
 *                     enum: [public, restricted, private]
 *                     example: public
 *                   locationType:
 *                     type: string
 *                     enum: [storage, office, lab, workshop, warehouse, other]
 *                     example: storage
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: [updated, bulk]
 *     responses:
 *       200:
 *         description: Locations updated successfully
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
 *                   example: Bulk update completed. 2 locations updated, 0 errors.
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: number
 *                       example: 2
 *                     errorCount:
 *                       type: number
 *                       example: 0
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Location'
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           message:
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
router.put('/bulk-update', authorize('admin', 'stock-manager'), bulkUpdateLocations);

module.exports = router;

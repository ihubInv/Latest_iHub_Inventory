const express = require('express');
const router = express.Router();
const {
  getReturnRequests,
  getReturnRequest,
  createReturnRequest,
  approveReturnRequest,
  rejectReturnRequest,
  getPendingReturnRequests,
  getReturnRequestsByEmployee,
  getMyReturnRequests,
  deleteReturnRequest
} = require('../controllers/returnRequestController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Public routes (authenticated users)
router.get('/my-returns', getMyReturnRequests);
router.post('/', createReturnRequest);

// Admin/Stock Manager only routes
router.get('/pending', authorize('admin', 'stock-manager'), getPendingReturnRequests);
router.get('/employee/:employeeId', getReturnRequestsByEmployee);
router.put('/:id/approve', authorize('admin', 'stock-manager'), approveReturnRequest);
router.put('/:id/reject', authorize('admin', 'stock-manager'), rejectReturnRequest);

// General routes
router.get('/', getReturnRequests);
router.get('/:id', getReturnRequest);
router.delete('/:id', deleteReturnRequest);

module.exports = router;

const Request = require('../models/Request');
const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all requests
// @route   GET /api/requests
// @access  Private
const getRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-submittedat';
  const search = req.query.search;

  // Build query
  let query = {};

  // If user is employee, only show their requests
  if (req.user.role === 'employee') {
    query.employeeid = req.user.id;
  }

  if (search) {
    query.$or = [
      { employeename: { $regex: search, $options: 'i' } },
      { itemtype: { $regex: search, $options: 'i' } },
      { purpose: { $regex: search, $options: 'i' } },
      { justification: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by status if specified
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by priority if specified
  if (req.query.priority) {
    query.priority = req.query.priority;
  }

  // Filter by department if specified
  if (req.query.department) {
    query.department = req.query.department;
  }

  const requests = await Request.find(query)
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Request.countDocuments(query);

  res.json({
    success: true,
    count: requests.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: requests
  });
});

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Private
const getRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate('employeeid', 'name email department phone')
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname specification');

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  // Check if user can access this request
  if (req.user.role === 'employee' && request.employeeid._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this request'
    });
  }

  res.json({
    success: true,
    data: request
  });
});

// @desc    Create request
// @route   POST /api/requests
// @access  Private
const createRequest = asyncHandler(async (req, res) => {
  const { itemtype, quantity, purpose, justification, expectedreturndate, priority, department, project, estimatedcost } = req.body;

  const request = await Request.create({
    employeeid: req.user.id,
    employeename: req.user.name,
    itemtype,
    quantity,
    purpose,
    justification,
    expectedreturndate,
    priority: priority || 'medium',
    department: department || req.user.department,
    project,
    estimatedcost
  });

  const populatedRequest = await Request.findById(request._id)
    .populate('employeeid', 'name email department');

  res.status(201).json({
    success: true,
    message: 'Request created successfully',
    data: populatedRequest
  });
});

// @desc    Update request
// @route   PUT /api/requests/:id
// @access  Private
const updateRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  // Check if user can update this request
  if (req.user.role === 'employee' && request.employeeid.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this request'
    });
  }

  // Check if request can be updated
  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update request that has been reviewed'
    });
  }

  // Update fields
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined && key !== 'status') {
      request[key] = req.body[key];
    }
  });

  await request.save();

  const populatedRequest = await Request.findById(request._id)
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email');

  res.json({
    success: true,
    message: 'Request updated successfully',
    data: populatedRequest
  });
});

// @desc    Delete request
// @route   DELETE /api/requests/:id
// @access  Private
const deleteRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  // Check if user can delete this request
  if (req.user.role === 'employee' && request.employeeid.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this request'
    });
  }

  // Check if request can be deleted
  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete request that has been reviewed'
    });
  }

  await Request.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Request deleted successfully'
  });
});

// @desc    Approve request
// @route   PUT /api/requests/:id/approve
// @access  Private (Admin/Stock Manager)
const approveRequest = asyncHandler(async (req, res) => {
  const { remarks, approvedQuantity, inventoryItemId } = req.body;

  const request = await Request.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Request has already been reviewed'
    });
  }

  // If inventory item is specified, check availability
  if (inventoryItemId) {
    const inventoryItem = await InventoryItem.findById(inventoryItemId);
    
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    if (inventoryItem.balancequantityinstock < (approvedQuantity || request.quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    // Store the previous quantity before issuing
    const previousQuantity = inventoryItem.balancequantityinstock;
    const issueQuantity = approvedQuantity || request.quantity;

    // Log before issuing
    console.log('🔵 BEFORE Issue - Item Status:', inventoryItem.status, 'Stock:', inventoryItem.balancequantityinstock);

    // Issue the item
    const updatedItem = await inventoryItem.issueItem(
      request.employeename,
      req.user.name,
      request.expectedreturndate
    );

    // Log after issuing
    console.log('🟢 AFTER Issue - Item Status:', updatedItem.status, 'Stock:', updatedItem.balancequantityinstock);

    // Create transaction record
    await InventoryTransaction.create({
      inventoryitemid: inventoryItem._id,
      transactiontype: 'issue',
      quantity: issueQuantity,
      previousquantity: previousQuantity,
      newquantity: updatedItem.balancequantityinstock,
      issuedto: request.employeeid,
      issuedby: req.user.id,
      purpose: request.purpose,
      notes: `Approved request: ${request._id}`,
      expectedreturndate: request.expectedreturndate,
      requestid: request._id,
      status: 'completed'
    });

    // Assign inventory item to request
    request.inventoryitemid = inventoryItemId;
  }

  // Approve the request
  await request.approve(req.user.id, req.user.name, remarks, approvedQuantity);

  const populatedRequest = await Request.findById(request._id)
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname');

  res.json({
    success: true,
    message: 'Request approved successfully',
    data: populatedRequest
  });
});

// @desc    Reject request
// @route   PUT /api/requests/:id/reject
// @access  Private (Admin/Stock Manager)
const rejectRequest = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const request = await Request.findById(req.params.id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Request not found'
    });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Request has already been reviewed'
    });
  }

  // Reject the request
  await request.reject(req.user.id, req.user.name, rejectionReason);

  const populatedRequest = await Request.findById(request._id)
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email');

  res.json({
    success: true,
    message: 'Request rejected successfully',
    data: populatedRequest
  });
});

// @desc    Get pending requests
// @route   GET /api/requests/pending
// @access  Private (Admin/Stock Manager)
const getPendingRequests = asyncHandler(async (req, res) => {
  const requests = await Request.findPending()
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email');

  res.json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Get requests by employee
// @route   GET /api/requests/employee/:employeeId
// @access  Private
const getRequestsByEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  // Check if user can access these requests
  if (req.user.role === 'employee' && employeeId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access these requests'
    });
  }

  const requests = await Request.findByEmployee(employeeId)
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname');

  res.json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Get overdue requests
// @route   GET /api/requests/overdue
// @access  Private (Admin/Stock Manager)
const getOverdueRequests = asyncHandler(async (req, res) => {
  const requests = await Request.findOverdue()
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email');

  res.json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Get request statistics
// @route   GET /api/requests/stats
// @access  Private
const getRequestStats = asyncHandler(async (req, res) => {
  let matchStage = {};

  // If user is employee, only show their stats
  if (req.user.role === 'employee') {
    matchStage.employeeid = req.user.id;
  }

  const stats = await Request.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  const totalRequests = await Request.countDocuments(matchStage);
  const pendingRequests = await Request.countDocuments({ ...matchStage, status: 'pending' });
  const approvedRequests = await Request.countDocuments({ ...matchStage, status: 'approved' });
  const rejectedRequests = await Request.countDocuments({ ...matchStage, status: 'rejected' });

  res.json({
    success: true,
    data: {
      total: totalRequests,
      pending: pendingRequests,
      approved: approvedRequests,
      rejected: rejectedRequests,
      byStatus: stats
    }
  });
});

// @desc    Get my requests
// @route   GET /api/requests/my-requests
// @access  Private
const getMyRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-submittedat';

  const requests = await Request.find({ employeeid: req.user.id })
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Request.countDocuments({ employeeid: req.user.id });

  res.json({
    success: true,
    count: requests.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: requests
  });
});

module.exports = {
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
};

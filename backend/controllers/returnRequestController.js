const ReturnRequest = require('../models/ReturnRequest');
const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all return requests
// @route   GET /api/return-requests
// @access  Private
const getReturnRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-requestedat';

  // Build query
  let query = {};

  // If user is employee, only show their return requests
  if (req.user.role === 'employee') {
    query.employeeid = req.user.id;
  }

  // Filter by status if specified
  if (req.query.status) {
    query.status = req.query.status;
  }

  const returnRequests = await ReturnRequest.find(query)
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await ReturnRequest.countDocuments(query);

  res.json({
    success: true,
    count: returnRequests.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: returnRequests
  });
});

// @desc    Get single return request
// @route   GET /api/return-requests/:id
// @access  Private
const getReturnRequest = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id)
    .populate('employeeid', 'name email department phone')
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname specification');

  if (!returnRequest) {
    return res.status(404).json({
      success: false,
      message: 'Return request not found'
    });
  }

  // Check if user can access this return request
  if (req.user.role === 'employee' && returnRequest.employeeid._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this return request'
    });
  }

  res.json({
    success: true,
    data: returnRequest
  });
});

// @desc    Create return request
// @route   POST /api/return-requests
// @access  Private (Employee)
const createReturnRequest = asyncHandler(async (req, res) => {
  const { inventoryitemid, assetname, returnreason, conditiononreturn, notes } = req.body;

  // Check if inventory item exists
  const inventoryItem = await InventoryItem.findById(inventoryitemid);

  if (!inventoryItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Check if item is issued to this user
  if (inventoryItem.status !== 'issued' || inventoryItem.issuedto !== req.user.name) {
    return res.status(400).json({
      success: false,
      message: 'This item is not issued to you or is not currently issued'
    });
  }

  // Check if there's already a pending return request for this item
  const existingRequest = await ReturnRequest.findOne({
    inventoryitemid,
    status: 'pending'
  });

  if (existingRequest) {
    return res.status(400).json({
      success: false,
      message: 'A return request for this item is already pending'
    });
  }

  const returnRequest = await ReturnRequest.create({
    employeeid: req.user.id,
    employeename: req.user.name,
    inventoryitemid,
    assetname: assetname || inventoryItem.assetname,
    returnreason,
    conditiononreturn,
    notes
  });

  const populatedRequest = await ReturnRequest.findById(returnRequest._id)
    .populate('employeeid', 'name email department')
    .populate('inventoryitemid', 'uniqueid assetname');

  res.status(201).json({
    success: true,
    message: 'Return request created successfully',
    data: populatedRequest
  });
});

// @desc    Approve return request
// @route   PUT /api/return-requests/:id/approve
// @access  Private (Admin/Stock Manager)
const approveReturnRequest = asyncHandler(async (req, res) => {
  const { remarks } = req.body;

  const returnRequest = await ReturnRequest.findById(req.params.id);

  if (!returnRequest) {
    return res.status(404).json({
      success: false,
      message: 'Return request not found'
    });
  }

  if (returnRequest.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Return request has already been reviewed'
    });
  }

  // Get the inventory item
  const inventoryItem = await InventoryItem.findById(returnRequest.inventoryitemid);

  if (!inventoryItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  console.log('🔵 BEFORE Return - Item Status:', inventoryItem.status, 'Stock:', inventoryItem.balancequantityinstock);

  // Return the item using the returnItem method
  await inventoryItem.returnItem(req.user.name);

  // Update condition based on return request
  inventoryItem.conditionofasset = returnRequest.conditiononreturn;
  await inventoryItem.save();

  console.log('🟢 AFTER Return - Item Status:', inventoryItem.status, 'Stock:', inventoryItem.balancequantityinstock);

  // Create transaction record
  await InventoryTransaction.create({
    inventoryitemid: inventoryItem._id,
    transactiontype: 'return',
    quantity: 1,
    previousquantity: inventoryItem.balancequantityinstock - 1,
    newquantity: inventoryItem.balancequantityinstock,
    issuedto: returnRequest.employeeid,  // Person who returned the item
    issuedby: req.user.id,  // Admin/Stock Manager who approved the return
    notes: `Approved return request: ${returnRequest._id}. Reason: ${returnRequest.returnreason}. Condition: ${returnRequest.conditiononreturn}`,
    condition: returnRequest.conditiononreturn,
    actualreturndate: new Date(),
    status: 'completed'
  });

  // Approve the return request
  await returnRequest.approve(req.user.id, req.user.name, remarks);

  const populatedRequest = await ReturnRequest.findById(returnRequest._id)
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname');

  res.json({
    success: true,
    message: 'Return request approved successfully',
    data: populatedRequest
  });
});

// @desc    Reject return request
// @route   PUT /api/return-requests/:id/reject
// @access  Private (Admin/Stock Manager)
const rejectReturnRequest = asyncHandler(async (req, res) => {
  const { rejectionreason } = req.body;

  if (!rejectionreason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required'
    });
  }

  const returnRequest = await ReturnRequest.findById(req.params.id);

  if (!returnRequest) {
    return res.status(404).json({
      success: false,
      message: 'Return request not found'
    });
  }

  if (returnRequest.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Return request has already been reviewed'
    });
  }

  // Reject the return request
  await returnRequest.reject(req.user.id, req.user.name, rejectionreason);

  const populatedRequest = await ReturnRequest.findById(returnRequest._id)
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email');

  res.json({
    success: true,
    message: 'Return request rejected successfully',
    data: populatedRequest
  });
});

// @desc    Get pending return requests
// @route   GET /api/return-requests/pending
// @access  Private (Admin/Stock Manager)
const getPendingReturnRequests = asyncHandler(async (req, res) => {
  const returnRequests = await ReturnRequest.findPending()
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname assetcategory');

  res.json({
    success: true,
    count: returnRequests.length,
    data: returnRequests
  });
});

// @desc    Get return requests by employee
// @route   GET /api/return-requests/employee/:employeeId
// @access  Private
const getReturnRequestsByEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  // Check if user can access these return requests
  if (req.user.role === 'employee' && employeeId !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access these return requests'
    });
  }

  const returnRequests = await ReturnRequest.findByEmployee(employeeId)
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname assetcategory');

  res.json({
    success: true,
    count: returnRequests.length,
    data: returnRequests
  });
});

// @desc    Get my return requests
// @route   GET /api/return-requests/my-returns
// @access  Private
const getMyReturnRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-requestedat';

  const returnRequests = await ReturnRequest.find({ employeeid: req.user.id })
    .populate('reviewedby', 'name email')
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await ReturnRequest.countDocuments({ employeeid: req.user.id });

  res.json({
    success: true,
    count: returnRequests.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: returnRequests
  });
});

// @desc    Delete return request
// @route   DELETE /api/return-requests/:id
// @access  Private
const deleteReturnRequest = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);

  if (!returnRequest) {
    return res.status(404).json({
      success: false,
      message: 'Return request not found'
    });
  }

  // Check if user can delete this return request
  if (req.user.role === 'employee' && returnRequest.employeeid.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this return request'
    });
  }

  // Check if return request can be deleted
  if (returnRequest.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete return request that has been reviewed'
    });
  }

  await ReturnRequest.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Return request deleted successfully'
  });
});

module.exports = {
  getReturnRequests,
  getReturnRequest,
  createReturnRequest,
  approveReturnRequest,
  rejectReturnRequest,
  getPendingReturnRequests,
  getReturnRequestsByEmployee,
  getMyReturnRequests,
  deleteReturnRequest
};

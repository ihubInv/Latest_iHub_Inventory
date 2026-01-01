const InventoryTransaction = require('../models/InventoryTransaction');
const InventoryItem = require('../models/InventoryItem');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all inventory transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-transactiondate';

  // Build query
  let query = {};

  // Filter by transaction type if specified
  if (req.query.type) {
    query.transactiontype = req.query.type;
  }

  // Filter by status if specified
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by date range if specified
  if (req.query.startDate && req.query.endDate) {
    query.transactiondate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  // Filter by user if specified
  if (req.query.userId) {
    query.$or = [
      { issuedto: req.query.userId },
      { issuedby: req.query.userId }
    ];
  }

  const transactions = await InventoryTransaction.find(query)
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .populate('issuedto', 'name email department')
    .populate('issuedby', 'name email')
    .populate('approvedby', 'name email')
    .populate('requestid', 'employeename itemtype purpose')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await InventoryTransaction.countDocuments(query);

  res.json({
    success: true,
    count: transactions.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: transactions
  });
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await InventoryTransaction.findById(req.params.id)
    .populate('inventoryitemid', 'uniqueid assetname assetcategory specification')
    .populate('issuedto', 'name email department phone')
    .populate('issuedby', 'name email')
    .populate('approvedby', 'name email')
    .populate('requestid', 'employeename itemtype purpose justification');

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  res.json({
    success: true,
    data: transaction
  });
});

// @desc    Get transactions by inventory item
// @route   GET /api/transactions/item/:itemId
// @access  Private
const getTransactionsByItem = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const transactions = await InventoryTransaction.findByItem(req.params.itemId)
    .populate('issuedto', 'name email department')
    .populate('issuedby', 'name email')
    .populate('approvedby', 'name email')
    .populate('requestid', 'employeename itemtype purpose')
    .skip(skip)
    .limit(limit);

  const total = await InventoryTransaction.countDocuments({ inventoryitemid: req.params.itemId });

  res.json({
    success: true,
    count: transactions.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: transactions
  });
});

// @desc    Get transactions by user
// @route   GET /api/transactions/user/:userId
// @access  Private
const getTransactionsByUser = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const transactions = await InventoryTransaction.findByUser(req.params.userId)
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .populate('issuedto', 'name email department')
    .populate('issuedby', 'name email')
    .populate('approvedby', 'name email')
    .populate('requestid', 'employeename itemtype purpose')
    .skip(skip)
    .limit(limit);

  const total = await InventoryTransaction.countDocuments({
    $or: [
      { issuedto: req.params.userId },
      { issuedby: req.params.userId }
    ]
  });

  res.json({
    success: true,
    count: transactions.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: transactions
  });
});

// @desc    Get overdue transactions
// @route   GET /api/transactions/overdue
// @access  Private (Admin/Stock Manager)
const getOverdueTransactions = asyncHandler(async (req, res) => {
  const transactions = await InventoryTransaction.findOverdue()
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .populate('issuedto', 'name email department phone')
    .populate('issuedby', 'name email');

  res.json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Get pending transactions
// @route   GET /api/transactions/pending
// @access  Private (Admin/Stock Manager)
const getPendingTransactions = asyncHandler(async (req, res) => {
  const transactions = await InventoryTransaction.findPending()
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .populate('issuedto', 'name email department')
    .populate('issuedby', 'name email')
    .populate('approvedby', 'name email');

  res.json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
const getTransactionStats = asyncHandler(async (req, res) => {
  const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

  const stats = await InventoryTransaction.getStatistics(startDate, endDate);

  const totalTransactions = await InventoryTransaction.countDocuments();
  const pendingTransactions = await InventoryTransaction.countDocuments({ status: 'pending' });
  const completedTransactions = await InventoryTransaction.countDocuments({ status: 'completed' });

  res.json({
    success: true,
    data: {
      total: totalTransactions,
      pending: pendingTransactions,
      completed: completedTransactions,
      byType: stats
    }
  });
});

// @desc    Get monthly transaction report
// @route   GET /api/transactions/monthly-report
// @access  Private (Admin/Stock Manager)
const getMonthlyReport = asyncHandler(async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({
      success: false,
      message: 'Year and month are required'
    });
  }

  const report = await InventoryTransaction.getMonthlyReport(parseInt(year), parseInt(month));

  res.json({
    success: true,
    data: {
      year: parseInt(year),
      month: parseInt(month),
      report
    }
  });
});

// @desc    Approve transaction
// @route   PUT /api/transactions/:id/approve
// @access  Private (Admin/Stock Manager)
const approveTransaction = asyncHandler(async (req, res) => {
  const transaction = await InventoryTransaction.findById(req.params.id);

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  if (transaction.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Transaction is not pending'
    });
  }

  await transaction.approve(req.user.id);

  const updatedTransaction = await InventoryTransaction.findById(transaction._id)
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .populate('issuedto', 'name email department')
    .populate('issuedby', 'name email')
    .populate('approvedby', 'name email');

  res.json({
    success: true,
    message: 'Transaction approved successfully',
    data: updatedTransaction
  });
});

// @desc    Cancel transaction
// @route   PUT /api/transactions/:id/cancel
// @access  Private (Admin/Stock Manager)
const cancelTransaction = asyncHandler(async (req, res) => {
  const transaction = await InventoryTransaction.findById(req.params.id);

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  if (transaction.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel completed transaction'
    });
  }

  await transaction.cancel();

  const updatedTransaction = await InventoryTransaction.findById(transaction._id)
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .populate('issuedto', 'name email department')
    .populate('issuedby', 'name email')
    .populate('approvedby', 'name email');

  res.json({
    success: true,
    message: 'Transaction cancelled successfully',
    data: updatedTransaction
  });
});

// @desc    Complete transaction
// @route   PUT /api/transactions/:id/complete
// @access  Private (Admin/Stock Manager)
const completeTransaction = asyncHandler(async (req, res) => {
  const transaction = await InventoryTransaction.findById(req.params.id);

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  if (transaction.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Transaction is already completed'
    });
  }

  await transaction.complete();

  const updatedTransaction = await InventoryTransaction.findById(transaction._id)
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .populate('issuedto', 'name email department')
    .populate('issuedby', 'name email')
    .populate('approvedby', 'name email');

  res.json({
    success: true,
    message: 'Transaction completed successfully',
    data: updatedTransaction
  });
});

// @desc    Return item from transaction
// @route   POST /api/transactions/:id/return
// @access  Private (Admin/Stock Manager)
const returnItemFromTransaction = asyncHandler(async (req, res) => {
  const { condition, notes } = req.body;

  const transaction = await InventoryTransaction.findById(req.params.id);

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  if (transaction.transactiontype !== 'issue') {
    return res.status(400).json({
      success: false,
      message: 'Can only return items from issue transactions'
    });
  }

  if (transaction.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Transaction must be completed to return item'
    });
  }

  const returnTransaction = await transaction.returnItem(req.user.id, new Date(), condition, notes);

  const populatedReturnTransaction = await InventoryTransaction.findById(returnTransaction._id)
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .populate('issuedto', 'name email department')
    .populate('issuedby', 'name email');

  res.json({
    success: true,
    message: 'Item returned successfully',
    data: populatedReturnTransaction
  });
});

// @desc    Get transaction audit trail
// @route   GET /api/transactions/audit-trail
// @access  Private (Admin/Stock Manager)
const getAuditTrail = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build query for audit trail
  let query = {};

  // Filter by date range if specified
  if (req.query.startDate && req.query.endDate) {
    query.transactiondate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  // Filter by user if specified
  if (req.query.userId) {
    query.$or = [
      { issuedto: req.query.userId },
      { issuedby: req.query.userId }
    ];
  }

  // Filter by transaction type if specified
  if (req.query.type) {
    query.transactiontype = req.query.type;
  }

  const transactions = await InventoryTransaction.find(query)
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .populate('issuedto', 'name email department')
    .populate('issuedby', 'name email')
    .populate('approvedby', 'name email')
    .populate('requestid', 'employeename itemtype purpose')
    .sort({ transactiondate: -1 })
    .skip(skip)
    .limit(limit);

  const total = await InventoryTransaction.countDocuments(query);

  res.json({
    success: true,
    count: transactions.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: transactions
  });
});

module.exports = {
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
};

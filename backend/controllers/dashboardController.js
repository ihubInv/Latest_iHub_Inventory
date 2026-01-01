const User = require('../models/User');
const InventoryItem = require('../models/InventoryItem');
const Request = require('../models/Request');
const Category = require('../models/Category');
const Asset = require('../models/Asset');
const InventoryTransaction = require('../models/InventoryTransaction');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const user = req.user;

  // Get basic counts
  const [
    totalUsers,
    totalInventoryItems,
    totalRequests,
    totalCategories,
    totalAssets,
    totalTransactions
  ] = await Promise.all([
    User.countDocuments(),
    InventoryItem.countDocuments(),
    Request.countDocuments(),
    Category.countDocuments(),
    Asset.countDocuments(),
    InventoryTransaction.countDocuments()
  ]);

  // Get inventory statistics
  const inventoryStats = await InventoryItem.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalcost' },
        totalQuantity: { $sum: '$balancequantityinstock' }
      }
    }
  ]);

  // Get request statistics
  const requestStats = await Request.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  // Get transaction statistics
  const transactionStats = await InventoryTransaction.aggregate([
    {
      $group: {
        _id: '$transactiontype',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  // Get low stock items
  const lowStockItems = await InventoryItem.find({
    $expr: {
      $lte: ['$balancequantityinstock', '$minimumstocklevel']
    },
    status: 'available'
  }).countDocuments();

  // Get pending requests
  const pendingRequests = await Request.countDocuments({ status: 'pending' });

  // Get overdue transactions
  const now = new Date();
  const overdueTransactions = await InventoryTransaction.countDocuments({
    transactiontype: 'issue',
    expectedreturndate: { $lt: now },
    status: 'completed'
  });

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentActivity = await InventoryTransaction.find({
    transactiondate: { $gte: sevenDaysAgo }
  })
    .populate('inventoryitemid', 'uniqueid assetname')
    .populate('issuedto', 'name')
    .populate('issuedby', 'name')
    .sort({ transactiondate: -1 })
    .limit(10);

  // Get top categories by inventory count
  const topCategories = await InventoryItem.aggregate([
    {
      $group: {
        _id: '$assetcategory',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalcost' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);

  // Get monthly transaction trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyTrend = await InventoryTransaction.aggregate([
    {
      $match: {
        transactiondate: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$transactiondate' },
          month: { $month: '$transactiondate' }
        },
        count: { $sum: 1 },
        issues: {
          $sum: { $cond: [{ $eq: ['$transactiontype', 'issue'] }, 1, 0] }
        },
        returns: {
          $sum: { $cond: [{ $eq: ['$transactiontype', 'return'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Get user-specific data if employee
  let userSpecificData = null;
  if (user.role === 'employee') {
    const userRequests = await Request.find({ employeeid: user.id })
      .sort({ submittedat: -1 })
      .limit(5);

    const userTransactions = await InventoryTransaction.find({
      $or: [
        { issuedto: user.id },
        { issuedby: user.id }
      ]
    })
      .populate('inventoryitemid', 'uniqueid assetname')
      .sort({ transactiondate: -1 })
      .limit(5);

    userSpecificData = {
      recentRequests: userRequests,
      recentTransactions: userTransactions
    };
  }

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalInventoryItems,
        totalRequests,
        totalCategories,
        totalAssets,
        totalTransactions
      },
      inventory: {
        byStatus: inventoryStats,
        lowStockCount: lowStockItems,
        topCategories
      },
      requests: {
        byStatus: requestStats,
        pendingCount: pendingRequests
      },
      transactions: {
        byType: transactionStats,
        overdueCount: overdueTransactions,
        monthlyTrend
      },
      recentActivity,
      userSpecific: userSpecificData
    }
  });
});

// @desc    Get inventory overview
// @route   GET /api/dashboard/inventory-overview
// @access  Private
const getInventoryOverview = asyncHandler(async (req, res) => {
  // Get total inventory value
  const totalValue = await InventoryItem.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$totalcost' }
      }
    }
  ]);

  // Get inventory by condition
  const byCondition = await InventoryItem.aggregate([
    {
      $group: {
        _id: '$conditionofasset',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalcost' }
      }
    }
  ]);

  // Get inventory by location
  const byLocation = await InventoryItem.aggregate([
    {
      $group: {
        _id: '$locationofitem',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalcost' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Get recent additions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentAdditions = await InventoryItem.find({
    createdAt: { $gte: thirtyDaysAgo }
  })
    .populate('assetcategoryid', 'name')
    .populate('createdby', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  // Get items needing attention
  const itemsNeedingAttention = await InventoryItem.find({
    $or: [
      { $expr: { $lte: ['$balancequantityinstock', '$minimumstocklevel'] } },
      { conditionofasset: { $in: ['poor', 'damaged'] } },
      { status: 'maintenance' }
    ]
  })
    .populate('assetcategoryid', 'name')
    .sort({ balancequantityinstock: 1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      totalValue: totalValue[0]?.total || 0,
      byCondition,
      byLocation,
      recentAdditions,
      itemsNeedingAttention
    }
  });
});

// @desc    Get request overview
// @route   GET /api/dashboard/request-overview
// @access  Private
const getRequestOverview = asyncHandler(async (req, res) => {
  const user = req.user;

  // Build query based on user role
  let query = {};
  if (user.role === 'employee') {
    query.employeeid = user.id;
  }

  // Get request statistics
  const requestStats = await Request.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  // Get requests by priority
  const byPriority = await Request.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get requests by department
  const byDepartment = await Request.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Get recent requests
  const recentRequests = await Request.find(query)
    .populate('employeeid', 'name email department')
    .populate('reviewedby', 'name')
    .sort({ submittedat: -1 })
    .limit(10);

  // Get overdue requests (for admins/managers)
  let overdueRequests = [];
  if (user.role !== 'employee') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    overdueRequests = await Request.find({
      status: 'pending',
      submittedat: { $lt: sevenDaysAgo }
    })
      .populate('employeeid', 'name email department')
      .sort({ submittedat: 1 })
      .limit(10);
  }

  res.json({
    success: true,
    data: {
      byStatus: requestStats,
      byPriority,
      byDepartment,
      recentRequests,
      overdueRequests
    }
  });
});

// @desc    Get transaction overview
// @route   GET /api/dashboard/transaction-overview
// @access  Private
const getTransactionOverview = asyncHandler(async (req, res) => {
  const user = req.user;

  // Build query based on user role
  let query = {};
  if (user.role === 'employee') {
    query.$or = [
      { issuedto: user.id },
      { issuedby: user.id }
    ];
  }

  // Get transaction statistics
  const transactionStats = await InventoryTransaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$transactiontype',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  // Get transactions by status
  const byStatus = await InventoryTransaction.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get recent transactions
  const recentTransactions = await InventoryTransaction.find(query)
    .populate('inventoryitemid', 'uniqueid assetname assetcategory')
    .populate('issuedto', 'name email')
    .populate('issuedby', 'name')
    .sort({ transactiondate: -1 })
    .limit(10);

  // Get overdue transactions (for admins/managers)
  let overdueTransactions = [];
  if (user.role !== 'employee') {
    const now = new Date();
    overdueTransactions = await InventoryTransaction.find({
      transactiontype: 'issue',
      expectedreturndate: { $lt: now },
      status: 'completed'
    })
      .populate('inventoryitemid', 'uniqueid assetname')
      .populate('issuedto', 'name email department')
      .sort({ expectedreturndate: 1 })
      .limit(10);
  }

  // Get monthly transaction count (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyCount = await InventoryTransaction.aggregate([
    {
      $match: {
        ...query,
        transactiondate: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$transactiondate' },
          month: { $month: '$transactiondate' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      byType: transactionStats,
      byStatus,
      recentTransactions,
      overdueTransactions,
      monthlyCount
    }
  });
});

// @desc    Get user activity
// @route   GET /api/dashboard/user-activity
// @access  Private
const getUserActivity = asyncHandler(async (req, res) => {
  const user = req.user;

  // Get user's recent requests
  const recentRequests = await Request.find({ employeeid: user.id })
    .populate('reviewedby', 'name')
    .sort({ submittedat: -1 })
    .limit(5);

  // Get user's recent transactions
  const recentTransactions = await InventoryTransaction.find({
    $or: [
      { issuedto: user.id },
      { issuedby: user.id }
    ]
  })
    .populate('inventoryitemid', 'uniqueid assetname')
    .populate('issuedto', 'name')
    .populate('issuedby', 'name')
    .sort({ transactiondate: -1 })
    .limit(5);

  // Get user's request statistics
  const requestStats = await Request.aggregate([
    { $match: { employeeid: user.id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get user's transaction statistics
  const transactionStats = await InventoryTransaction.aggregate([
    {
      $match: {
        $or: [
          { issuedto: user.id },
          { issuedby: user.id }
        ]
      }
    },
    {
      $group: {
        _id: '$transactiontype',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      recentRequests,
      recentTransactions,
      requestStats,
      transactionStats
    }
  });
});

module.exports = {
  getDashboardStats,
  getInventoryOverview,
  getRequestOverview,
  getTransactionOverview,
  getUserActivity
};

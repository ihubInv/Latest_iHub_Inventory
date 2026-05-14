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
    const userRequests = await Request.find({ employeeid: user._id })
      .sort({ submittedat: -1 })
      .limit(5);

    const userTransactions = await InventoryTransaction.find({
      $or: [{ issuedto: user._id }, { issuedby: user._id }],
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
  // Get key totals used by dashboard cards/charts
  const [totalsAgg, byStatusRaw, byCategoryRaw, byLocationRaw, byCondition, topItems, categoryAssets] = await Promise.all([
    InventoryItem.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $ifNull: ['$totalcost', 0] } },
          availableItems: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          issuedItems: { $sum: { $cond: [{ $eq: ['$status', 'issued'] }, 1, 0] } }
        }
      }
    ]),
    InventoryItem.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          value: { $sum: { $ifNull: ['$totalcost', 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]),
    Category.aggregate([
      {
        $lookup: {
          from: 'inventoryitems',
          let: { categoryId: '$_id', categoryName: '$name' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$assetcategoryid', '$$categoryId'] },
                    { $eq: ['$assetcategory', '$$categoryName'] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                value: { $sum: { $ifNull: ['$totalcost', 0] } }
              }
            }
          ],
          as: 'inventoryStats'
        }
      },
      {
        $project: {
          _id: '$name',
          categoryName: '$name',
          count: { $ifNull: [{ $arrayElemAt: ['$inventoryStats.count', 0] }, 0] },
          value: { $ifNull: [{ $arrayElemAt: ['$inventoryStats.value', 0] }, 0] }
        }
      },
      { $sort: { categoryName: 1 } }
    ]),
    InventoryItem.aggregate([
      {
        $group: {
          _id: '$locationofitem',
          count: { $sum: 1 },
          value: { $sum: { $ifNull: ['$totalcost', 0] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          locationName: { $ifNull: ['$_id', 'Unknown'] },
          count: 1,
          value: 1
        }
      }
    ]),
    InventoryItem.aggregate([
      {
        $group: {
          _id: '$conditionofasset',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalcost' }
        }
      }
    ]),
    InventoryItem.aggregate([
      {
        $group: {
          _id: '$assetname',
          totalQuantity: { $sum: { $ifNull: ['$balancequantityinstock', 0] } },
          count: { $sum: 1 },
          totalValue: { $sum: { $ifNull: ['$totalcost', 0] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 1,
          assetName: { $ifNull: ['$_id', 'Unknown Asset'] },
          totalQuantity: 1,
          count: 1,
          totalValue: 1
        }
      }
    ]),
    Category.find({ isactive: true })
      .select('assetnames')
      .lean()
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

  const lowStockItems = await InventoryItem.countDocuments({
    $expr: { $lte: ['$balancequantityinstock', '$minimumstocklevel'] },
    status: 'available'
  });

  const totals = totalsAgg[0] || {
    totalItems: 0,
    totalValue: 0,
    availableItems: 0,
    issuedItems: 0
  };

  // Build asset chart data from both inventory and category master assetnames.
  // This ensures names are visible even when inventory rows are not created yet.
  const topItemsMap = new Map(
    (topItems || [])
      .filter((item) => item && item.assetName)
      .map((item) => [String(item.assetName).trim().toLowerCase(), item])
  );

  const categoryAssetNames = (categoryAssets || [])
    .flatMap((category) => category.assetnames || [])
    .filter((asset) => asset && asset.name && asset.isactive !== false)
    .map((asset) => String(asset.name).trim());

  const mergedTopItems = categoryAssetNames.map((assetName) => {
    const key = assetName.toLowerCase();
    const fromInventory = topItemsMap.get(key);
    return {
      _id: assetName,
      assetName,
      totalQuantity: fromInventory?.totalQuantity || 0,
      count: fromInventory?.count || 0,
      totalValue: fromInventory?.totalValue || 0
    };
  });

  // Include inventory-only names not present in category master list.
  const inventoryOnlyItems = (topItems || []).filter((item) => {
    const key = String(item.assetName || '').trim().toLowerCase();
    if (!key) return false;
    return !categoryAssetNames.some((name) => name.toLowerCase() === key);
  });

  const chartTopItems = [...mergedTopItems, ...inventoryOnlyItems];

  res.json({
    success: true,
    data: {
      totalItems: totals.totalItems || 0,
      totalValue: totals.totalValue || 0,
      availableItems: totals.availableItems || 0,
      issuedItems: totals.issuedItems || 0,
      lowStockItems,
      byStatus: byStatusRaw || [],
      byCategory: byCategoryRaw || [],
      byLocation: byLocationRaw || [],
      byCondition,
      topItems: chartTopItems,
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

  // Build query based on user role (use _id for aggregates — matches Request.employeeid ObjectId)
  let query = {};
  if (user.role === 'employee') {
    query.employeeid = user._id;
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

  // Get requests by priority and department
  const [byPriority, byDepartment] = await Promise.all([
    Request.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]),
    Request.aggregate([
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
    ])
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

  const statusMap = requestStats.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});
  const pendingRequests = statusMap.pending || 0;
  const approvedRequests = statusMap.approved || 0;
  const rejectedRequests = statusMap.rejected || 0;
  const totalRequests = pendingRequests + approvedRequests + rejectedRequests;

  res.json({
    success: true,
    data: {
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
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

  // Get monthly transaction count from existing historical data (latest 12 months with records)
  const monthlyCount = await InventoryTransaction.aggregate([
    {
      $match: query
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
      $sort: { '_id.year': -1, '_id.month': -1 }
    },
    {
      $limit: 12
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  const monthLabel = (year, month) => {
    return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' });
  };
  const monthlyTrends = monthlyCount.map((row) => ({
    month: monthLabel(row._id.year, row._id.month),
    count: row.count,
    totalQuantity: row.count
  }));

  const statusMap = byStatus.reduce((acc, row) => {
    acc[row._id] = row.count;
    return acc;
  }, {});
  const totalTransactions = byStatus.reduce((sum, row) => sum + row.count, 0);
  const pendingTransactions = statusMap.pending || 0;
  const completedTransactions = statusMap.completed || 0;
  const overdueCount = overdueTransactions.length;

  res.json({
    success: true,
    data: {
      totalTransactions,
      pendingTransactions,
      completedTransactions,
      overdueTransactions: overdueCount,
      byType: transactionStats,
      byStatus,
      recentTransactions,
      overdueItems: overdueTransactions,
      monthlyCount,
      monthlyTrends
    }
  });
});

// @desc    Get user activity
// @route   GET /api/dashboard/user-activity
// @access  Private
const getUserActivity = asyncHandler(async (req, res) => {
  const user = req.user;

  const userId = user._id;

  // Get user's recent requests
  const recentRequests = await Request.find({ employeeid: userId })
    .populate('reviewedby', 'name')
    .sort({ submittedat: -1 })
    .limit(5);

  // Get user's recent transactions
  const recentTransactions = await InventoryTransaction.find({
    $or: [{ issuedto: userId }, { issuedby: userId }],
  })
    .populate('inventoryitemid', 'uniqueid assetname')
    .populate('issuedto', 'name')
    .populate('issuedby', 'name')
    .sort({ transactiondate: -1 })
    .limit(5);

  // Get user's request statistics
  const requestStats = await Request.aggregate([
    { $match: { employeeid: userId } },
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
        $or: [{ issuedto: userId }, { issuedby: userId }],
      },
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

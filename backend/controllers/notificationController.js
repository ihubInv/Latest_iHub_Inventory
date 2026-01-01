const Request = require('../models/Request');
const InventoryTransaction = require('../models/InventoryTransaction');
const InventoryItem = require('../models/InventoryItem');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const user = req.user;
  const notifications = [];

  try {
    // Get pending requests (for admins and stock managers)
    if (user.role === 'admin' || user.role === 'stock-manager') {
      const pendingRequests = await Request.find({ status: 'pending' })
        .populate('employeeid', 'name email department')
        .sort({ submittedat: -1 })
        .limit(10);

      pendingRequests.forEach(request => {
        notifications.push({
          id: `request-${request._id}`,
          type: 'request',
          title: 'New Request',
          message: `${request.employeename} requested ${request.itemtype}`,
          data: {
            requestId: request._id,
            employeeName: request.employeename,
            itemType: request.itemtype,
            quantity: request.quantity,
            purpose: request.purpose
          },
          timestamp: request.submittedat,
          priority: request.priority || 'medium',
          isRead: false
        });
      });

      // Get overdue requests
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const overdueRequests = await Request.find({
        status: 'pending',
        submittedat: { $lt: sevenDaysAgo }
      })
        .populate('employeeid', 'name email department')
        .sort({ submittedat: 1 })
        .limit(5);

      overdueRequests.forEach(request => {
        notifications.push({
          id: `overdue-request-${request._id}`,
          type: 'overdue',
          title: 'Overdue Request',
          message: `Request from ${request.employeename} is overdue`,
          data: {
            requestId: request._id,
            employeeName: request.employeename,
            itemType: request.itemtype,
            daysOverdue: Math.floor((new Date() - request.submittedat) / (1000 * 60 * 60 * 24))
          },
          timestamp: request.submittedat,
          priority: 'high',
          isRead: false
        });
      });
    }

    // Get low stock notifications (for admins and stock managers)
    if (user.role === 'admin' || user.role === 'stock-manager') {
      const lowStockItems = await InventoryItem.find({
        $expr: {
          $lte: ['$balancequantityinstock', '$minimumstocklevel']
        },
        status: 'available'
      })
        .populate('assetcategoryid', 'name')
        .sort({ balancequantityinstock: 1 })
        .limit(10);

      lowStockItems.forEach(item => {
        notifications.push({
          id: `low-stock-${item._id}`,
          type: 'low-stock',
          title: 'Low Stock Alert',
          message: `${item.assetname} is running low (${item.balancequantityinstock} remaining)`,
          data: {
            itemId: item._id,
            itemName: item.assetname,
            currentStock: item.balancequantityinstock,
            minimumStock: item.minimumstocklevel,
            category: item.assetcategory
          },
          timestamp: new Date(),
          priority: item.balancequantityinstock === 0 ? 'critical' : 'high',
          isRead: false
        });
      });
    }

    // Get user's request status updates
    const userRequests = await Request.find({ employeeid: user.id })
      .populate('reviewedby', 'name')
      .sort({ submittedat: -1 })
      .limit(10);

    userRequests.forEach(request => {
      if (request.status === 'approved') {
        notifications.push({
          id: `approved-${request._id}`,
          type: 'approval',
          title: 'Request Approved',
          message: `Your request for ${request.itemtype} has been approved`,
          data: {
            requestId: request._id,
            itemType: request.itemtype,
            quantity: request.quantity,
            approvedBy: request.reviewername,
            approvedAt: request.reviewedat
          },
          timestamp: request.reviewedat,
          priority: 'medium',
          isRead: false
        });
      } else if (request.status === 'rejected') {
        notifications.push({
          id: `rejected-${request._id}`,
          type: 'rejection',
          title: 'Request Rejected',
          message: `Your request for ${request.itemtype} has been rejected`,
          data: {
            requestId: request._id,
            itemType: request.itemtype,
            quantity: request.quantity,
            rejectedBy: request.reviewername,
            rejectedAt: request.reviewedat,
            reason: request.rejectionreason
          },
          timestamp: request.reviewedat,
          priority: 'medium',
          isRead: false
        });
      }
    });

    // Get overdue items for current user
    const now = new Date();
    const userOverdueItems = await InventoryTransaction.find({
      issuedto: user.id,
      transactiontype: 'issue',
      expectedreturndate: { $lt: now },
      status: 'completed'
    })
      .populate('inventoryitemid', 'uniqueid assetname')
      .sort({ expectedreturndate: 1 })
      .limit(5);

    userOverdueItems.forEach(transaction => {
      const daysOverdue = Math.floor((now - transaction.expectedreturndate) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `overdue-item-${transaction._id}`,
        type: 'overdue-item',
        title: 'Overdue Item',
        message: `${transaction.inventoryitemid.assetname} is overdue by ${daysOverdue} days`,
        data: {
          transactionId: transaction._id,
          itemName: transaction.inventoryitemid.assetname,
          itemId: transaction.inventoryitemid.uniqueid,
          expectedReturnDate: transaction.expectedreturndate,
          daysOverdue
        },
        timestamp: transaction.expectedreturndate,
        priority: 'high',
        isRead: false
      });
    });

    // Get system notifications (for all users)
    const systemNotifications = [
      {
        id: 'system-maintenance',
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance on Sunday 2 AM - 4 AM',
        data: {
          maintenanceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next Sunday
          duration: '2 hours'
        },
        timestamp: new Date(),
        priority: 'low',
        isRead: false
      }
    ];

    notifications.push(...systemNotifications);

    // Sort notifications by priority and timestamp
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // Limit to 50 notifications
    const limitedNotifications = notifications.slice(0, 50);

    res.json({
      success: true,
      count: limitedNotifications.length,
      data: limitedNotifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  // In a real application, you would store notification read status in database
  // For now, we'll just return success
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  // In a real application, you would update notification read status in database
  // For now, we'll just return success
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Get notification count
// @route   GET /api/notifications/count
// @access  Private
const getNotificationCount = asyncHandler(async (req, res) => {
  const user = req.user;
  let count = 0;

  try {
    // Count pending requests (for admins and stock managers)
    if (user.role === 'admin' || user.role === 'stock-manager') {
      const pendingCount = await Request.countDocuments({ status: 'pending' });
      count += pendingCount;

      // Count overdue requests
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const overdueCount = await Request.countDocuments({
        status: 'pending',
        submittedat: { $lt: sevenDaysAgo }
      });
      count += overdueCount;

      // Count low stock items
      const lowStockCount = await InventoryItem.countDocuments({
        $expr: {
          $lte: ['$balancequantityinstock', '$minimumstocklevel']
        },
        status: 'available'
      });
      count += lowStockCount;
    }

    // Count user's unread request updates
    const userRequestUpdates = await Request.countDocuments({
      employeeid: user.id,
      status: { $in: ['approved', 'rejected'] },
      reviewedat: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    count += userRequestUpdates;

    // Count user's overdue items
    const now = new Date();
    const overdueItemsCount = await InventoryTransaction.countDocuments({
      issuedto: user.id,
      transactiontype: 'issue',
      expectedreturndate: { $lt: now },
      status: 'completed'
    });
    count += overdueItemsCount;

    // Add system notifications
    count += 1; // System maintenance notification

    res.json({
      success: true,
      data: {
        count
      }
    });

  } catch (error) {
    console.error('Error counting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error counting notifications'
    });
  }
});

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private
const getNotificationSettings = asyncHandler(async (req, res) => {
  const user = req.user;

  // Default notification settings
  const defaultSettings = {
    emailNotifications: true,
    pushNotifications: true,
    requestUpdates: true,
    lowStockAlerts: user.role === 'admin' || user.role === 'stock-manager',
    overdueAlerts: true,
    systemMaintenance: true,
    weeklyReports: user.role === 'admin' || user.role === 'stock-manager'
  };

  res.json({
    success: true,
    data: defaultSettings
  });
});

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { emailNotifications, pushNotifications, requestUpdates, lowStockAlerts, overdueAlerts, systemMaintenance, weeklyReports } = req.body;

  // In a real application, you would save these settings to the database
  // For now, we'll just return success
  res.json({
    success: true,
    message: 'Notification settings updated successfully',
    data: {
      emailNotifications,
      pushNotifications,
      requestUpdates,
      lowStockAlerts,
      overdueAlerts,
      systemMaintenance,
      weeklyReports
    }
  });
});

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationCount,
  getNotificationSettings,
  updateNotificationSettings
};

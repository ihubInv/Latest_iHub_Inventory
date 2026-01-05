const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');
const Request = require('../models/Request');
const ReturnRequest = require('../models/ReturnRequest');
const Location = require('../models/Location');
const SerialNumberCounter = require('../models/SerialNumberCounter');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
const getInventoryItems = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-createdAt';
  const search = req.query.search;

  // Build query
  let query = {};
  if (search) {
    query = {
      $or: [
        { uniqueid: { $regex: search, $options: 'i' } },
        { assetname: { $regex: search, $options: 'i' } },
        { productserialnumber: { $regex: search, $options: 'i' } },
        { vendorname: { $regex: search, $options: 'i' } },
        { locationofitem: { $regex: search, $options: 'i' } }
      ]
    };
  }

  // Filter by status if specified
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by category if specified
  if (req.query.category) {
    query.assetcategoryid = req.query.category;
  }

  // Filter by location if specified
  if (req.query.location) {
    query.locationofitem = req.query.location;
  }

  // Filter by condition if specified
  if (req.query.condition) {
    query.conditionofasset = req.query.condition;
  }

  // Filter by stock status
  if (req.query.stockStatus) {
    if (req.query.stockStatus === 'low') {
      query.$expr = { $lte: ['$balancequantityinstock', '$minimumstocklevel'] };
    } else if (req.query.stockStatus === 'out') {
      query.balancequantityinstock = 0;
    } else if (req.query.stockStatus === 'available') {
      query.balancequantityinstock = { $gt: 0 };
    }
  }

  const inventoryItems = await InventoryItem.find(query)
    .populate('assetcategoryid', 'name type')
    .populate('assetid', 'name description')
    .populate('locationid', 'name description address building floor')
    .populate('createdby', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await InventoryItem.countDocuments(query);

  res.json({
    success: true,
    count: inventoryItems.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: inventoryItems
  });
});

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
const getInventoryItem = asyncHandler(async (req, res) => {
  const inventoryItem = await InventoryItem.findById(req.params.id)
    .populate('assetcategoryid', 'name type description')
    .populate('assetid', 'name description manufacturer model')
    .populate('locationid', 'name description address building floor locationType')
    .populate('createdby', 'name email');

  if (!inventoryItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  res.json({
    success: true,
    data: inventoryItem
  });
});

// Helper function to generate asset code from asset name
const generateAssetCode = (assetName) => {
  if (!assetName) return '---';
  // Take first 3 letters and convert to uppercase, remove non-alphabetic characters
  return assetName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase().padEnd(3, '-');
};

// Helper function to generate unique ID with global serial number
const generateUniqueIdWithGlobalSerial = async (financialyear, assetname, locationofitem) => {
  // Get next global serial number atomically
  const serialNumber = await SerialNumberCounter.getNextSequence();
  const serialNumberStr = serialNumber.toString().padStart(3, '0');
  
  // Build unique ID: IHUB/{financialyear}/{assetcode}/{location}/{serial}
  let uniqueId = 'IHUB/';
  
  // Add financial year or placeholder
  if (financialyear) {
    uniqueId += financialyear;
  } else {
    uniqueId += '--';
  }
  uniqueId += '/';
  
  // Add asset code or placeholder
  if (assetname) {
    uniqueId += generateAssetCode(assetname);
  } else {
    uniqueId += '---';
  }
  uniqueId += '/';
  
  // Add location or placeholder
  if (locationofitem) {
    uniqueId += locationofitem.trim();
  } else {
    uniqueId += '--';
  }
  uniqueId += '/';
  
  // Add global serial number
  uniqueId += serialNumberStr;
  
  return uniqueId;
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private (Admin/Stock Manager)
const createInventoryItem = asyncHandler(async (req, res) => {
  // Validate location if provided
  if (req.body.locationid) {
    const location = await Location.findById(req.body.locationid);
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }
    if (!location.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign item to inactive location'
      });
    }
  }

  // Generate unique ID with global serial number if not provided or contains placeholder
  let uniqueId = req.body.uniqueid;
  const uniqueIdUpper = uniqueId ? uniqueId.toUpperCase().trim() : '';
  // Treat empty, AUTO, or ??? as placeholder - generate new unique ID
  if (!uniqueId || uniqueId.trim() === '' || uniqueIdUpper.includes('AUTO') || uniqueIdUpper.includes('???')) {
    // Ensure counter is initialized/synced with actual inventory count
    const currentCounter = await SerialNumberCounter.getCurrentSequence();
    if (currentCounter === 0) {
      // Sync counter with actual inventory count if it's not initialized
      const totalItems = await InventoryItem.countDocuments();
      if (totalItems > 0) {
        await SerialNumberCounter.findByIdAndUpdate(
          'global',
          { sequenceValue: totalItems },
          { upsert: true, new: true }
        );
      }
    }
    
    // Generate unique ID using global serial number
    uniqueId = await generateUniqueIdWithGlobalSerial(
      req.body.financialyear,
      req.body.assetname || req.body.assetnamefromcategory,
      req.body.locationofitem
    );
  } else {
    // Check for duplicate unique ID before creating
    const existingItem = await InventoryItem.findOne({ 
      uniqueid: uniqueId.toUpperCase().trim() 
    });
    
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: `uniqueid already exists: ${uniqueId}. Please use a different unique ID.`
      });
    }
    uniqueId = uniqueId.toUpperCase().trim();
  }

  // Convert empty productserialnumber to undefined to avoid validation issues
  const productserialnumber = req.body.productserialnumber?.trim();
  
  const inventoryData = {
    ...req.body,
    uniqueid: uniqueId,
    productserialnumber: productserialnumber && productserialnumber !== '' ? productserialnumber : undefined,
    createdby: req.user.id,
    lastmodifiedby: req.user.name
  };

  const inventoryItem = await InventoryItem.create(inventoryData);

  // Update location occupancy if location is specified
  if (inventoryItem.locationid) {
    try {
      const location = await Location.findById(inventoryItem.locationid);
      if (location) {
        await location.incrementOccupancy(inventoryItem.quantityperitem);
      }
    } catch (error) {
      console.error('Error updating location occupancy:', error);
    }
  }

  // Create initial transaction record
  await InventoryTransaction.create({
    inventoryitemid: inventoryItem._id,
    transactiontype: 'purchase',
    quantity: inventoryItem.quantityperitem,
    previousquantity: 0,
    newquantity: inventoryItem.balancequantityinstock,
    issuedby: req.user.id,
    purpose: 'Initial Purchase',
    notes: 'Item added to inventory',
    status: 'completed'
  });

  const populatedItem = await InventoryItem.findById(inventoryItem._id)
    .populate('assetcategoryid', 'name type')
    .populate('assetid', 'name description')
    .populate('locationid', 'name description address building floor')
    .populate('createdby', 'name email');

  res.status(201).json({
    success: true,
    message: 'Inventory item created successfully',
    data: populatedItem
  });
});

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Admin/Stock Manager)
const updateInventoryItem = asyncHandler(async (req, res) => {
  const inventoryItem = await InventoryItem.findById(req.params.id);

  if (!inventoryItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Update fields
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      // Convert empty productserialnumber to undefined
      if (key === 'productserialnumber') {
        const value = req.body[key]?.trim();
        inventoryItem[key] = value && value !== '' ? value : undefined;
      } else {
        inventoryItem[key] = req.body[key];
      }
    }
  });

  inventoryItem.lastmodifiedby = req.user.name;
  inventoryItem.lastmodifieddate = new Date();

  await inventoryItem.save();

  const populatedItem = await InventoryItem.findById(inventoryItem._id)
    .populate('assetcategoryid', 'name type')
    .populate('assetid', 'name description')
    .populate('locationid', 'name description address building floor')
    .populate('createdby', 'name email');

  res.json({
    success: true,
    message: 'Inventory item updated successfully',
    data: populatedItem
  });
});

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Admin, Stock Manager)
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const inventoryItem = await InventoryItem.findById(req.params.id);

  if (!inventoryItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  // Check if item is currently issued
  if (inventoryItem.status === 'issued') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete item that is currently issued'
    });
  }

  const itemId = req.params.id;

  try {
    // Start a transaction to ensure all deletions succeed or none do
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Delete related inventory transactions
      await InventoryTransaction.deleteMany({ inventoryitemid: itemId }, { session });
      
      // Delete related requests
      await Request.deleteMany({ inventoryitemid: itemId }, { session });
      
      // Delete related return requests
      await ReturnRequest.deleteMany({ inventoryitemid: itemId }, { session });
      
      // Finally delete the inventory item itself
      await InventoryItem.findByIdAndDelete(itemId, { session });
    });
    
    await session.endSession();

    res.json({
      success: true,
      message: 'Inventory item and all related records deleted successfully'
    });
  } catch (error) {
    console.error('Error during cascade delete:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting inventory item and related records'
    });
  }
});

// @desc    Issue inventory item
// @route   POST /api/inventory/:id/issue
// @access  Private (Admin/Stock Manager)
const issueInventoryItem = asyncHandler(async (req, res) => {
  const { issuedTo, expectedReturnDate, purpose, notes } = req.body;

  const inventoryItem = await InventoryItem.findById(req.params.id);

  if (!inventoryItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  if (inventoryItem.balancequantityinstock <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Item is out of stock'
    });
  }

  if (inventoryItem.status === 'issued') {
    return res.status(400).json({
      success: false,
      message: 'Item is already issued'
    });
  }

  // Store the previous quantity before issuing
  const previousQuantity = inventoryItem.balancequantityinstock;

  // Issue the item
  const updatedItem = await inventoryItem.issueItem(issuedTo, req.user.name, expectedReturnDate);

  // Create transaction record
  const transaction = await InventoryTransaction.create({
    inventoryitemid: inventoryItem._id,
    transactiontype: 'issue',
    quantity: 1,
    previousquantity: previousQuantity,
    newquantity: updatedItem.balancequantityinstock,
    issuedto: req.user.id, // Assuming issuedTo is user ID
    issuedby: req.user.id,
    purpose: purpose || 'Direct Issue',
    notes: notes || 'Item issued to employee',
    expectedreturndate: expectedReturnDate,
    status: 'completed'
  });

  const populatedItem = await InventoryItem.findById(inventoryItem._id)
    .populate('assetcategoryid', 'name type')
    .populate('assetid', 'name description')
    .populate('createdby', 'name email');

  res.json({
    success: true,
    message: 'Item issued successfully',
    data: {
      item: populatedItem,
      transaction
    }
  });
});

// @desc    Return inventory item
// @route   POST /api/inventory/:id/return
// @access  Private (Admin/Stock Manager)
const returnInventoryItem = asyncHandler(async (req, res) => {
  const { notes, condition } = req.body;

  const inventoryItem = await InventoryItem.findById(req.params.id);

  if (!inventoryItem) {
    return res.status(404).json({
      success: false,
      message: 'Inventory item not found'
    });
  }

  if (inventoryItem.status !== 'issued') {
    return res.status(400).json({
      success: false,
      message: 'Item is not currently issued'
    });
  }

  // Return the item
  await inventoryItem.returnItem(req.user.name);

  // Create transaction record
  const transaction = await InventoryTransaction.create({
    inventoryitemid: inventoryItem._id,
    transactiontype: 'return',
    quantity: 1,
    previousquantity: inventoryItem.balancequantityinstock - 1,
    newquantity: inventoryItem.balancequantityinstock,
    issuedby: req.user.id,
    purpose: 'Item Return',
    notes: notes || 'Item returned to inventory',
    condition: condition || 'excellent',
    actualreturndate: new Date(),
    status: 'completed'
  });

  const populatedItem = await InventoryItem.findById(inventoryItem._id)
    .populate('assetcategoryid', 'name type')
    .populate('assetid', 'name description')
    .populate('createdby', 'name email');

  res.json({
    success: true,
    message: 'Item returned successfully',
    data: {
      item: populatedItem,
      transaction
    }
  });
});

// @desc    Get available inventory items
// @route   GET /api/inventory/available
// @access  Private
const getAvailableInventoryItems = asyncHandler(async (req, res) => {
  const inventoryItems = await InventoryItem.findAvailable()
    .populate('assetcategoryid', 'name type')
    .populate('assetid', 'name description')
    .populate('locationid', 'name description address building floor')
    .sort({ assetname: 1 });

  res.json({
    success: true,
    count: inventoryItems.length,
    data: inventoryItems
  });
});

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private
const getLowStockItems = asyncHandler(async (req, res) => {
  const inventoryItems = await InventoryItem.findLowStock()
    .populate('assetcategoryid', 'name type')
    .populate('assetid', 'name description')
    .populate('locationid', 'name description address building floor')
    .sort({ balancequantityinstock: 1 });

  res.json({
    success: true,
    count: inventoryItems.length,
    data: inventoryItems
  });
});

// @desc    Get issued items
// @route   GET /api/inventory/issued
// @access  Private
const getIssuedItems = asyncHandler(async (req, res) => {
  const inventoryItems = await InventoryItem.findIssued()
    .populate('assetcategoryid', 'name type')
    .populate('assetid', 'name description')
    .populate('locationid', 'name description address building floor')
    .sort({ issueddate: -1 });

  res.json({
    success: true,
    count: inventoryItems.length,
    data: inventoryItems
  });
});

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private
const getInventoryStats = asyncHandler(async (req, res) => {
  const stats = await InventoryItem.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalcost' },
        totalQuantity: { $sum: '$balancequantityinstock' }
      }
    }
  ]);

  const totalItems = await InventoryItem.countDocuments();
  const totalValue = await InventoryItem.aggregate([
    { $group: { _id: null, total: { $sum: '$totalcost' } } }
  ]);

  const lowStockItems = await InventoryItem.findLowStock();

  res.json({
    success: true,
    data: {
      totalItems,
      totalValue: totalValue[0]?.total || 0,
      lowStockCount: lowStockItems.length,
      byStatus: stats
    }
  });
});

// @desc    Get inventory transactions
// @route   GET /api/inventory/:id/transactions
// @access  Private
const getInventoryTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const transactions = await InventoryTransaction.findByItem(req.params.id)
    .populate('issuedto', 'name email')
    .populate('issuedby', 'name email')
    .populate('approvedby', 'name email')
    .skip(skip)
    .limit(limit);

  const total = await InventoryTransaction.countDocuments({ inventoryitemid: req.params.id });

  res.json({
    success: true,
    count: transactions.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: transactions
  });
});

// @desc    Bulk update inventory items
// @route   PUT /api/inventory/bulk-update
// @access  Private (Admin/Stock Manager)
const bulkUpdateInventoryItems = asyncHandler(async (req, res) => {
  const { items, updates } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Items array is required'
    });
  }

  const results = [];
  const errors = [];

  for (const itemId of items) {
    try {
      const inventoryItem = await InventoryItem.findById(itemId);

      if (!inventoryItem) {
        errors.push({ itemId, error: 'Item not found' });
        continue;
      }

      // Update fields
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          inventoryItem[key] = updates[key];
        }
      });

      inventoryItem.lastmodifiedby = req.user.name;
      inventoryItem.lastmodifieddate = new Date();

      await inventoryItem.save();
      results.push(inventoryItem);
    } catch (error) {
      errors.push({ itemId, error: error.message });
    }
  }

  res.json({
    success: true,
    message: `Updated ${results.length} items successfully`,
    data: {
      updated: results.length,
      errors: errors.length,
      results,
      errors
    }
  });
});

// @desc    Get next serial number preview (current sequence + 1, read-only)
// @route   GET /api/inventory/next-serial-preview
// @access  Private
const getNextSerialPreview = asyncHandler(async (req, res) => {
  try {
    // Always sync counter with actual inventory count to ensure accuracy
    const totalItems = await InventoryItem.countDocuments();
    
    // Get current counter value
    let currentSequence = await SerialNumberCounter.getCurrentSequence();
    
    // If counter is less than actual item count, sync it
    // This handles cases where items were created before the counter system
    if (currentSequence < totalItems) {
      await SerialNumberCounter.findByIdAndUpdate(
        'global',
        { sequenceValue: totalItems },
        { upsert: true, new: true }
      );
      currentSequence = totalItems;
    }
    
    const nextSerial = currentSequence + 1;
    const nextSerialFormatted = nextSerial.toString().padStart(3, '0');
    
    res.json({
      success: true,
      data: {
        currentSequence,
        nextSerial,
        nextSerialFormatted
      }
    });
  } catch (error) {
    console.error('Error getting serial preview:', error);
    // Fallback: use inventory count directly
    try {
      const totalItems = await InventoryItem.countDocuments();
      const nextSerial = totalItems + 1;
      res.json({
        success: true,
        data: {
          currentSequence: totalItems,
          nextSerial,
          nextSerialFormatted: nextSerial.toString().padStart(3, '0')
        }
      });
    } catch (countError) {
      // Final fallback
      res.json({
        success: true,
        data: {
          currentSequence: 0,
          nextSerial: 1,
          nextSerialFormatted: '001'
        }
      });
    }
  }
});

// @desc    Get available asset names for requests (excluding pending/approved requests)
// @route   GET /api/inventory/available-asset-names
// @access  Private
const getAvailableAssetNames = asyncHandler(async (req, res) => {
  const Request = require('../models/Request');

  // Get all pending and approved requests to exclude their item types
  const pendingAndApprovedRequests = await Request.find({
    status: { $in: ['pending', 'approved'] }
  }).select('itemtype');

  // Create a set of item types that are currently requested or approved
  const requestedItemTypes = new Set(
    pendingAndApprovedRequests.map(req => req.itemtype.trim().toLowerCase())
  );

  // Get all available inventory items
  const availableItems = await InventoryItem.find({
    status: 'available',
    balancequantityinstock: { $gt: 0 }
  }).select('assetname');

  // Extract unique asset names
  const allAssetNames = new Set();
  availableItems.forEach(item => {
    if (item.assetname && item.assetname.trim()) {
      allAssetNames.add(item.assetname.trim());
    }
  });

  // Filter out asset names that have pending or approved requests
  const availableAssetNames = Array.from(allAssetNames).filter(
    assetName => !requestedItemTypes.has(assetName.toLowerCase())
  ).sort();

  res.json({
    success: true,
    count: availableAssetNames.length,
    data: availableAssetNames
  });
});

module.exports = {
  getInventoryItems,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  issueInventoryItem,
  returnInventoryItem,
  getAvailableInventoryItems,
  getLowStockItems,
  getIssuedItems,
  getInventoryStats,
  getInventoryTransactions,
  bulkUpdateInventoryItems,
  getAvailableAssetNames,
  getNextSerialPreview
};

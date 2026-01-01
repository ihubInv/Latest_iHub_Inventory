const Asset = require('../models/Asset');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
const getAssets = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || 'name';
  const search = req.query.search;

  // Build query
  let query = {};

  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { assetcode: { $regex: search, $options: 'i' } }
      ]
    };
  }

  // Filter by category if specified
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by manufacturer if specified
  if (req.query.manufacturer) {
    query.manufacturer = req.query.manufacturer;
  }

  // Filter by active status if specified
  if (req.query.isactive !== undefined) {
    query.isactive = req.query.isactive === 'true';
  }

  const assets = await Asset.find(query)
    .populate('category', 'name type description')
    .populate('createdby', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Asset.countDocuments(query);

  res.json({
    success: true,
    count: assets.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: assets
  });
});

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
const getAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id)
    .populate('category', 'name type description')
    .populate('createdby', 'name email');

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  res.json({
    success: true,
    data: asset
  });
});

// @desc    Create asset
// @route   POST /api/assets
// @access  Private (Admin/Stock Manager)
const createAsset = asyncHandler(async (req, res) => {
  const { name, description, category, manufacturer, model, specifications, unitprice, currency, tags, purchaseDate, warrantyPeriod, expectedLifespan, depreciationMethod, depreciationRate } = req.body;

  // Check if asset already exists
  const existingAsset = await Asset.findOne({ name });
  if (existingAsset) {
    return res.status(400).json({
      success: false,
      message: 'Asset already exists with this name'
    });
  }

  const asset = await Asset.create({
    name,
    description,
    category,
    manufacturer,
    model,
    specifications,
    unitprice,
    currency,
    tags,
    purchaseDate,
    warrantyPeriod,
    expectedLifespan,
    depreciationMethod,
    depreciationRate,
    createdby: req.user.id
  });

  const populatedAsset = await Asset.findById(asset._id)
    .populate('category', 'name type description')
    .populate('createdby', 'name email');

  res.status(201).json({
    success: true,
    message: 'Asset created successfully',
    data: populatedAsset
  });
});

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private (Admin/Stock Manager)
const updateAsset = asyncHandler(async (req, res) => {
  const { name, description, category, manufacturer, model, specifications, unitprice, currency, tags, purchaseDate, warrantyPeriod, expectedLifespan, depreciationMethod, depreciationRate, isactive } = req.body;

  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  // Check if name is being changed and if it already exists
  if (name && name !== asset.name) {
    const existingAsset = await Asset.findOne({ name });
    if (existingAsset) {
      return res.status(400).json({
        success: false,
        message: 'Asset already exists with this name'
      });
    }
  }

  // Update fields
  if (name) asset.name = name;
  if (description) asset.description = description;
  if (category) asset.category = category;
  if (manufacturer) asset.manufacturer = manufacturer;
  if (model) asset.model = model;
  if (specifications) asset.specifications = specifications;
  if (unitprice) asset.unitprice = unitprice;
  if (currency) asset.currency = currency;
  if (tags) asset.tags = tags;
  if (purchaseDate) asset.purchaseDate = purchaseDate;
  if (warrantyPeriod) asset.warrantyPeriod = warrantyPeriod;
  if (expectedLifespan) asset.expectedLifespan = expectedLifespan;
  if (depreciationMethod) asset.depreciationMethod = depreciationMethod;
  if (depreciationRate) asset.depreciationRate = depreciationRate;
  if (isactive !== undefined) asset.isactive = isactive;

  await asset.save();

  const populatedAsset = await Asset.findById(asset._id)
    .populate('category', 'name type description')
    .populate('createdby', 'name email');

  res.json({
    success: true,
    message: 'Asset updated successfully',
    data: populatedAsset
  });
});

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private (Admin)
const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  // Check if asset has inventory items
  const InventoryItem = require('../models/InventoryItem');
  const inventoryItems = await InventoryItem.find({ assetid: asset._id });
  if (inventoryItems.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete asset that has inventory items'
    });
  }

  await Asset.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Asset deleted successfully'
  });
});

// @desc    Get active assets
// @route   GET /api/assets/active
// @access  Private
const getActiveAssets = asyncHandler(async (req, res) => {
  const assets = await Asset.findActive()
    .populate('category', 'name type description')
    .populate('createdby', 'name email');

  res.json({
    success: true,
    count: assets.length,
    data: assets
  });
});

// @desc    Get assets by category
// @route   GET /api/assets/category/:categoryId
// @access  Private
const getAssetsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const assets = await Asset.findByCategory(categoryId)
    .populate('category', 'name type description')
    .populate('createdby', 'name email');

  res.json({
    success: true,
    count: assets.length,
    data: assets
  });
});

// @desc    Get assets with inventory
// @route   GET /api/assets/with-inventory
// @access  Private
const getAssetsWithInventory = asyncHandler(async (req, res) => {
  const assets = await Asset.findWithInventory();

  res.json({
    success: true,
    count: assets.length,
    data: assets
  });
});

// @desc    Search assets
// @route   GET /api/assets/search
// @access  Private
const searchAssets = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const assets = await Asset.searchAssets(q)
    .populate('category', 'name type description')
    .populate('createdby', 'name email');

  res.json({
    success: true,
    count: assets.length,
    data: assets
  });
});

// @desc    Get asset inventory summary
// @route   GET /api/assets/:id/inventory-summary
// @access  Private
const getAssetInventorySummary = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  const summary = await asset.getInventorySummary();

  res.json({
    success: true,
    data: {
      asset: {
        id: asset._id,
        name: asset.name,
        description: asset.description,
        manufacturer: asset.manufacturer,
        model: asset.model
      },
      summary: summary[0] || {
        totalItems: 0,
        availableItems: 0,
        issuedItems: 0,
        totalValue: 0
      }
    }
  });
});

// @desc    Toggle asset active status
// @route   PUT /api/assets/:id/toggle-active
// @access  Private (Admin/Stock Manager)
const toggleAssetActive = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  await asset.toggleActive();

  const populatedAsset = await Asset.findById(asset._id)
    .populate('category', 'name type description')
    .populate('createdby', 'name email');

  res.json({
    success: true,
    message: `Asset ${asset.isactive ? 'activated' : 'deactivated'} successfully`,
    data: populatedAsset
  });
});

// @desc    Add tag to asset
// @route   POST /api/assets/:id/tags
// @access  Private (Admin/Stock Manager)
const addTag = asyncHandler(async (req, res) => {
  const { tag } = req.body;

  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  await asset.addTag(tag);

  const populatedAsset = await Asset.findById(asset._id)
    .populate('category', 'name type description')
    .populate('createdby', 'name email');

  res.json({
    success: true,
    message: 'Tag added successfully',
    data: populatedAsset
  });
});

// @desc    Remove tag from asset
// @route   DELETE /api/assets/:id/tags/:tag
// @access  Private (Admin/Stock Manager)
const removeTag = asyncHandler(async (req, res) => {
  const { tag } = req.params;

  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    return res.status(404).json({
      success: false,
      message: 'Asset not found'
    });
  }

  await asset.removeTag(tag);

  const populatedAsset = await Asset.findById(asset._id)
    .populate('category', 'name type description')
    .populate('createdby', 'name email');

  res.json({
    success: true,
    message: 'Tag removed successfully',
    data: populatedAsset
  });
});

// @desc    Get asset statistics
// @route   GET /api/assets/stats
// @access  Private
const getAssetStats = asyncHandler(async (req, res) => {
  const stats = await Asset.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isactive', true] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    {
      $unwind: '$category'
    },
    {
      $project: {
        categoryName: '$category.name',
        count: 1,
        active: 1
      }
    }
  ]);

  const totalAssets = await Asset.countDocuments();
  const activeAssets = await Asset.countDocuments({ isactive: true });
  const inactiveAssets = totalAssets - activeAssets;

  res.json({
    success: true,
    data: {
      total: totalAssets,
      active: activeAssets,
      inactive: inactiveAssets,
      byCategory: stats
    }
  });
});

module.exports = {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  getActiveAssets,
  getAssetsByCategory,
  getAssetsWithInventory,
  searchAssets,
  getAssetInventorySummary,
  toggleAssetActive,
  addTag,
  removeTag,
  getAssetStats
};

const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
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
        { categorycode: { $regex: search, $options: 'i' } }
      ]
    };
  }

  // Filter by type if specified
  if (req.query.type) {
    query.type = req.query.type;
  }

  // Filter by active status if specified
  if (req.query.isactive !== undefined) {
    query.isactive = req.query.isactive === 'true';
  }

  const categories = await Category.find(query)
    .populate('createdby', 'name email')
    .populate('parentcategory', 'name type')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Category.countDocuments(query);

  res.json({
    success: true,
    count: categories.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: categories
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('createdby', 'name email')
    .populate('parentcategory', 'name type description')
    .populate('subcategories', 'name type description isactive');

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  res.json({
    success: true,
    data: category
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin/Stock Manager)
const createCategory = asyncHandler(async (req, res) => {
  const { name, type, description, parentcategory, categorycode, depreciationrate, lifespanyears, tags } = req.body;

  // Check if category already exists
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: 'Category already exists with this name'
    });
  }

  const category = await Category.create({
    name,
    type,
    description,
    parentcategory,
    categorycode,
    depreciationrate,
    lifespanyears,
    tags,
    createdby: req.user.id
  });

  const populatedCategory = await Category.findById(category._id)
    .populate('createdby', 'name email')
    .populate('parentcategory', 'name type');

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: populatedCategory
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin/Stock Manager)
const updateCategory = asyncHandler(async (req, res) => {
  const { name, type, description, parentcategory, categorycode, depreciationrate, lifespanyears, tags, isactive } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check if name is being changed and if it already exists
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists with this name'
      });
    }
  }

  // Update fields
  if (name) category.name = name;
  if (type) category.type = type;
  if (description) category.description = description;
  if (parentcategory) category.parentcategory = parentcategory;
  if (categorycode) category.categorycode = categorycode;
  if (depreciationrate) category.depreciationrate = depreciationrate;
  if (lifespanyears) category.lifespanyears = lifespanyears;
  if (tags) category.tags = tags;
  if (isactive !== undefined) category.isactive = isactive;

  await category.save();

  const populatedCategory = await Category.findById(category._id)
    .populate('createdby', 'name email')
    .populate('parentcategory', 'name type');

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: populatedCategory
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check if category has subcategories
  const subcategories = await Category.find({ parentcategory: category._id });
  if (subcategories.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete category that has subcategories'
    });
  }

  // Check if category has inventory items
  const InventoryItem = require('../models/InventoryItem');
  const inventoryItems = await InventoryItem.find({ assetcategoryid: category._id });
  if (inventoryItems.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete category that has inventory items'
    });
  }

  await Category.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// @desc    Get active categories
// @route   GET /api/categories/active
// @access  Private
const getActiveCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findActive()
    .populate('createdby', 'name email')
    .populate('parentcategory', 'name type');

  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get categories by type
// @route   GET /api/categories/type/:type
// @access  Private
const getCategoriesByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const categories = await Category.findByType(type)
    .populate('createdby', 'name email')
    .populate('parentcategory', 'name type');

  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get major categories
// @route   GET /api/categories/major
// @access  Private
const getMajorCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findMajor()
    .populate('createdby', 'name email')
    .populate('subcategories', 'name type description isactive');

  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get minor categories
// @route   GET /api/categories/minor
// @access  Private
const getMinorCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findMinor()
    .populate('createdby', 'name email')
    .populate('parentcategory', 'name type');

  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Get categories with inventory
// @route   GET /api/categories/with-inventory
// @access  Private
const getCategoriesWithInventory = asyncHandler(async (req, res) => {
  const categories = await Category.findWithInventory();

  res.json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Add asset name to category
// @route   POST /api/categories/:id/assets
// @access  Private (Admin/Stock Manager)
const addAssetName = asyncHandler(async (req, res) => {
  const { assetName, description } = req.body;

  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  await category.addAssetName(assetName, description);

  const updatedCategory = await Category.findById(category._id)
    .populate('createdby', 'name email');

  res.json({
    success: true,
    message: 'Asset name added successfully',
    data: updatedCategory
  });
});

// @desc    Remove asset name from category
// @route   DELETE /api/categories/:id/assets/:assetName
// @access  Private (Admin/Stock Manager)
const removeAssetName = asyncHandler(async (req, res) => {
  const { assetName } = req.params;

  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  await category.removeAssetName(assetName);

  const updatedCategory = await Category.findById(category._id)
    .populate('createdby', 'name email');

  res.json({
    success: true,
    message: 'Asset name removed successfully',
    data: updatedCategory
  });
});

// @desc    Toggle asset name status
// @route   PUT /api/categories/:id/assets/:assetName/toggle
// @access  Private (Admin/Stock Manager)
const toggleAssetName = asyncHandler(async (req, res) => {
  const { assetName } = req.params;

  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  await category.toggleAssetName(assetName);

  const updatedCategory = await Category.findById(category._id)
    .populate('createdby', 'name email');

  res.json({
    success: true,
    message: 'Asset name status toggled successfully',
    data: updatedCategory
  });
});

// @desc    Get category statistics
// @route   GET /api/categories/stats
// @access  Private
const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await Category.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isactive', true] }, 1, 0] }
        }
      }
    }
  ]);

  const totalCategories = await Category.countDocuments();
  const activeCategories = await Category.countDocuments({ isactive: true });
  const inactiveCategories = totalCategories - activeCategories;

  res.json({
    success: true,
    data: {
      total: totalCategories,
      active: activeCategories,
      inactive: inactiveCategories,
      byType: stats
    }
  });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getActiveCategories,
  getCategoriesByType,
  getMajorCategories,
  getMinorCategories,
  getCategoriesWithInventory,
  addAssetName,
  removeAssetName,
  toggleAssetName,
  getCategoryStats
};

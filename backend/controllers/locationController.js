const Location = require('../models/Location');
const InventoryItem = require('../models/InventoryItem');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all locations
// @route   GET /api/locations
// @access  Private
const getLocations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || 'name';
  const search = req.query.search;
  const type = req.query.type;
  const status = req.query.status;
  const building = req.query.building;

  // Build query
  let query = {};
  
  if (search) {
    query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { building: { $regex: search, $options: 'i' } },
        { floor: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    };
  }

  // Filter by type
  if (type) {
    query.locationType = type;
  }

  // Filter by status
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  // Filter by building
  if (building) {
    query.building = { $regex: building, $options: 'i' };
  }

  const locations = await Location.find(query)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Location.countDocuments(query);

  res.json({
    success: true,
    count: locations.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: locations
  });
});

// @desc    Get single location
// @route   GET /api/locations/:id
// @access  Private
const getLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'Location not found'
    });
  }

  // Get inventory items in this location
  const inventoryItems = await InventoryItem.find({ locationofitem: location.name })
    .populate('assetcategoryid', 'name type')
    .select('assetname status balancequantityinstock conditionofasset');

  res.json({
    success: true,
    data: {
      ...location.toObject(),
      inventoryItems: {
        total: inventoryItems.length,
        available: inventoryItems?.filter(item => item.status === 'available').length,
        issued: inventoryItems?.filter(item => item.status === 'issued').length,
        maintenance: inventoryItems?.filter(item => item.status === 'maintenance').length,
        items: inventoryItems
      }
    }
  });
});

// @desc    Create location
// @route   POST /api/locations
// @access  Private (Admin/Stock Manager)
const createLocation = asyncHandler(async (req, res) => {
  const locationData = {
    ...req.body,
    createdBy: req.user.id,
    lastModifiedBy: req.user.id
  };

  // Check if location name already exists
  const existingLocation = await Location.findOne({ name: locationData.name });
  if (existingLocation) {
    return res.status(400).json({
      success: false,
      message: 'Location with this name already exists'
    });
  }

  const location = await Location.create(locationData);

  const populatedLocation = await Location.findById(location._id)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Location created successfully',
    data: populatedLocation
  });
});

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private (Admin/Stock Manager)
const updateLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);

  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'Location not found'
    });
  }

  // Check if new name conflicts with existing location
  if (req.body.name && req.body.name !== location.name) {
    const existingLocation = await Location.findOne({ name: req.body.name });
    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: 'Location with this name already exists'
      });
    }
  }

  // Update fields
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      location[key] = req.body[key];
    }
  });

  location.lastModifiedBy = req.user.id;

  await location.save();

  const populatedLocation = await Location.findById(location._id)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

  res.json({
    success: true,
    message: 'Location updated successfully',
    data: populatedLocation
  });
});

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Private (Admin)
const deleteLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);

  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'Location not found'
    });
  }

  // Check if location has inventory items
  const inventoryItems = await InventoryItem.find({ locationofitem: location.name });
  if (inventoryItems.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete location. ${inventoryItems.length} inventory items are currently assigned to this location. Please reassign them first.`
    });
  }

  // Check if this is the default location
  if (location.isDefault) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete the default location'
    });
  }

  await Location.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Location deleted successfully'
  });
});

// @desc    Toggle location status
// @route   PATCH /api/locations/:id/toggle-status
// @access  Private (Admin/Stock Manager)
const toggleLocationStatus = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);

  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'Location not found'
    });
  }

  // Cannot deactivate default location
  if (location.isDefault && location.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Cannot deactivate the default location'
    });
  }

  location.isActive = !location.isActive;
  location.lastModifiedBy = req.user.id;

  await location.save();

  const populatedLocation = await Location.findById(location._id)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

  res.json({
    success: true,
    message: `Location ${location.isActive ? 'activated' : 'deactivated'} successfully`,
    data: populatedLocation
  });
});

// @desc    Set default location
// @route   PATCH /api/locations/:id/set-default
// @access  Private (Admin)
const setDefaultLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);

  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'Location not found'
    });
  }

  if (!location.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Cannot set inactive location as default'
    });
  }

  location.isDefault = true;
  location.lastModifiedBy = req.user.id;

  await location.save();

  const populatedLocation = await Location.findById(location._id)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

  res.json({
    success: true,
    message: 'Default location set successfully',
    data: populatedLocation
  });
});

// @desc    Get active locations
// @route   GET /api/locations/active
// @access  Private
const getActiveLocations = asyncHandler(async (req, res) => {
  const locations = await Location.findActive()
    .populate('createdBy', 'name email')
    .sort({ name: 1 });

  res.json({
    success: true,
    count: locations.length,
    data: locations
  });
});

// @desc    Get locations by type
// @route   GET /api/locations/type/:type
// @access  Private
const getLocationsByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  
  const validTypes = ['storage', 'office', 'lab', 'workshop', 'warehouse', 'other'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid location type'
    });
  }

  const locations = await Location.findByType(type)
    .populate('createdBy', 'name email')
    .sort({ name: 1 });

  res.json({
    success: true,
    count: locations.length,
    data: locations
  });
});

// @desc    Get locations with available capacity
// @route   GET /api/locations/available-capacity
// @access  Private
const getLocationsWithCapacity = asyncHandler(async (req, res) => {
  const minCapacity = parseInt(req.query.minCapacity) || 1;
  
  const locations = await Location.findWithCapacity(minCapacity)
    .populate('createdBy', 'name email')
    .sort({ name: 1 });

  res.json({
    success: true,
    count: locations.length,
    data: locations
  });
});

// @desc    Get default location
// @route   GET /api/locations/default
// @access  Private
const getDefaultLocation = asyncHandler(async (req, res) => {
  const location = await Location.findDefault()
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');

  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'No default location found'
    });
  }

  res.json({
    success: true,
    data: location
  });
});

// @desc    Get location statistics
// @route   GET /api/locations/stats
// @access  Private
const getLocationStats = asyncHandler(async (req, res) => {
  const stats = await Location.getStatistics();
  
  // Get additional statistics
  const totalLocations = await Location.countDocuments();
  const activeLocations = await Location.countDocuments({ isActive: true });
  const locationsByType = await Location.aggregate([
    {
      $group: {
        _id: '$locationType',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const locationsByBuilding = await Location.aggregate([
    {
      $match: { building: { $exists: true, $ne: null, $ne: '' } }
    },
    {
      $group: {
        _id: '$building',
        count: { $sum: 1 },
        totalCapacity: { $sum: '$capacity' },
        totalOccupancy: { $sum: '$currentOccupancy' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      ...stats[0],
      totalLocations,
      activeLocations,
      inactiveLocations: totalLocations - activeLocations,
      byType: locationsByType,
      byBuilding: locationsByBuilding
    }
  });
});

// @desc    Update location occupancy
// @route   PATCH /api/locations/:id/occupancy
// @access  Private (Admin/Stock Manager)
const updateLocationOccupancy = asyncHandler(async (req, res) => {
  const { occupancy, action } = req.body;
  const location = await Location.findById(req.params.id);

  if (!location) {
    return res.status(404).json({
      success: false,
      message: 'Location not found'
    });
  }

  try {
    let updatedLocation;
    
    if (action === 'set') {
      updatedLocation = await location.updateOccupancy(occupancy);
    } else if (action === 'increment') {
      updatedLocation = await location.incrementOccupancy(occupancy || 1);
    } else if (action === 'decrement') {
      updatedLocation = await location.decrementOccupancy(occupancy || 1);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "set", "increment", or "decrement"'
      });
    }

    const populatedLocation = await Location.findById(updatedLocation._id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    res.json({
      success: true,
      message: 'Location occupancy updated successfully',
      data: populatedLocation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Bulk update locations
// @route   PUT /api/locations/bulk-update
// @access  Private (Admin/Stock Manager)
const bulkUpdateLocations = asyncHandler(async (req, res) => {
  const { locations, updates } = req.body;

  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Locations array is required'
    });
  }

  const results = [];
  const errors = [];

  for (const locationId of locations) {
    try {
      const location = await Location.findById(locationId);
      
      if (!location) {
        errors.push({ locationId, error: 'Location not found' });
        continue;
      }

      // Update fields
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          location[key] = updates[key];
        }
      });

      location.lastModifiedBy = req.user.id;

      await location.save();
      results.push(location);
    } catch (error) {
      errors.push({ locationId, error: error.message });
    }
  }

  res.json({
    success: true,
    message: `Updated ${results.length} locations successfully`,
    data: {
      updated: results.length,
      errors: errors.length,
      results,
      errors
    }
  });
});

module.exports = {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  toggleLocationStatus,
  setDefaultLocation,
  getActiveLocations,
  getLocationsByType,
  getLocationsWithCapacity,
  getDefaultLocation,
  getLocationStats,
  updateLocationOccupancy,
  bulkUpdateLocations
};

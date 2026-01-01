const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/Stock Manager)
const getUsers = asyncHandler(async (req, res) => {
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
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ]
    };
  }

  // Filter by role if specified
  if (req.query.role) {
    query.role = req.query.role;
  }

  // Filter by active status if specified
  if (req.query.isactive !== undefined) {
    query.isactive = req.query.isactive === 'true';
  }

  const users = await User.find(query)
    .select('-password -refreshTokens')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/Stock Manager)
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshTokens');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin)
const createUser = asyncHandler(async (req, res) => {
  const { email, name, password, role, department, phone, address, location, bio } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  const user = await User.create({
    email,
    name,
    password,
    role,
    department,
    phone,
    address,
    location,
    bio,
    createdby: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isactive: user.isactive,
      phone: user.phone,
      address: user.address,
      location: user.location,
      bio: user.bio,
      createdAt: user.createdAt
    }
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
  const { name, role, department, phone, address, location, bio, isactive } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update fields
  if (name) user.name = name;
  if (role) user.role = role;
  if (department) user.department = department;
  if (phone) user.phone = phone;
  if (address) user.address = address;
  if (location) user.location = location;
  if (bio) user.bio = bio;
  if (isactive !== undefined) user.isactive = isactive;

  await user.save();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isactive: user.isactive,
      phone: user.phone,
      address: user.address,
      location: user.location,
      bio: user.bio,
      lastlogin: user.lastlogin,
      createdAt: user.createdAt
    }
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user is trying to delete themselves
  if (user._id.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  // Check if user is the last admin
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin', isactive: true });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last admin user'
      });
    }
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Deactivate user
// @route   PUT /api/users/:id/deactivate
// @access  Private (Admin)
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user is trying to deactivate themselves
  if (user._id.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot deactivate your own account'
    });
  }

  // Check if user is the last admin
  if (user.role === 'admin' && user.isactive) {
    const adminCount = await User.countDocuments({ role: 'admin', isactive: true });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate the last admin user'
      });
    }
  }

  user.isactive = false;
  await user.save();

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Activate user
// @route   PUT /api/users/:id/activate
// @access  Private (Admin)
const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.isactive = true;
  await user.save();

  res.json({
    success: true,
    message: 'User activated successfully'
  });
});

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private (Admin/Stock Manager)
const getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const users = await User.findByRole(role).select('-password -refreshTokens');

  res.json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get active users
// @route   GET /api/users/active
// @access  Private (Admin/Stock Manager)
const getActiveUsers = asyncHandler(async (req, res) => {
  const users = await User.findActiveUsers().select('-password -refreshTokens');

  res.json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin)
const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$isactive', true] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isactive: true });
  const inactiveUsers = totalUsers - activeUsers;

  res.json({
    success: true,
    data: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: stats
    }
  });
});

// @desc    Upload profile picture
// @route   POST /api/users/:id/profile-picture
// @access  Private
const uploadProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user is updating their own profile or is admin
  if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this profile'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  // Update profile picture
  user.profilepicture = req.file.path;
  await user.save();

  res.json({
    success: true,
    message: 'Profile picture uploaded successfully',
    data: {
      profilepicture: user.profilepicture
    }
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  getUsersByRole,
  getActiveUsers,
  getUserStats,
  uploadProfilePicture
};

const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const inventoryRoutes = require('./inventory');
const requestRoutes = require('./requests');
const returnRequestRoutes = require('./returnRequests');
const categoryRoutes = require('./categories');
const assetRoutes = require('./assets');
const transactionRoutes = require('./transactions');
const dashboardRoutes = require('./dashboard');
const notificationRoutes = require('./notifications');
const locationRoutes = require('./locations');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/requests', requestRoutes);
router.use('/return-requests', returnRequestRoutes);
router.use('/categories', categoryRoutes);
router.use('/assets', assetRoutes);
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/locations', locationRoutes);

module.exports = router;

const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'stock-manager', 'employee'])
    .withMessage('Role must be admin, stock-manager, or employee'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  handleValidationErrors
];

// User update validation rules
const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  handleValidationErrors
];

// Login validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Inventory item validation rules
const validateInventoryItem = [
  body('uniqueid')
    .optional()
    .trim()
    .custom((value) => {
      // Allow empty string or undefined (backend will generate it)
      if (!value || value === '' || value.toUpperCase().includes('AUTO')) {
        return true;
      }
      // If provided, it must not be empty after trimming
      return value.trim().length > 0;
    })
    .withMessage('Unique ID will be generated automatically if not provided'),
  body('financialyear')
    .trim()
    .notEmpty()
    .withMessage('Financial year is required')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Financial year must be in format YYYY-YY (e.g., 2020-21)')
    .custom((value) => {
      // Validate financial year format: YYYY-YY where YY is the last 2 digits of YYYY+1
      const [startYear, endYear] = value.split('-');
      const start = parseInt(startYear, 10);
      const end = parseInt(endYear, 10);
      const expectedEnd = parseInt((start + 1).toString().slice(-2), 10);
      
      // Check if end year matches start year + 1
      if (end !== expectedEnd) {
        throw new Error('Invalid financial year format. End year must be start year + 1 (e.g., 2020-21)');
      }
      
      // Check if financial year is from 2020 onwards
      if (start < 2020) {
        throw new Error('Financial year must be from 2020-21 onwards');
      }
      
      return true;
    })
    .withMessage('Invalid financial year'),
  body('assetcategory')
    .trim()
    .notEmpty()
    .withMessage('Asset category is required'),
  body('assetcategoryid')
    .isMongoId()
    .withMessage('Valid asset category ID is required'),
  body('assetname')
    .trim()
    .notEmpty()
    .withMessage('Asset name is required'),
  body('productserialnumber')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Product serial number cannot exceed 200 characters'),
  body('vendorname')
    .trim()
    .notEmpty()
    .withMessage('Vendor name is required'),
  body('quantityperitem')
    .isInt({ min: 1 })
    .withMessage('Quantity per item must be at least 1'),
  body('rateinclusivetax')
    .isFloat({ min: 0 })
    .withMessage('Rate inclusive of tax must be a positive number'),
  body('totalcost')
    .isFloat({ min: 0 })
    .withMessage('Total cost must be a positive number'),
  body('locationofitem')
    .trim()
    .notEmpty()
    .withMessage('Location of item is required'),
  body('balancequantityinstock')
    .isInt({ min: 0 })
    .withMessage('Balance quantity in stock must be a non-negative integer'),
  body('conditionofasset')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor', 'damaged'])
    .withMessage('Condition must be excellent, good, fair, poor, or damaged'),
  body('status')
    .optional()
    .isIn(['available', 'issued', 'maintenance', 'retired'])
    .withMessage('Status must be available, issued, maintenance, or retired'),
  body('minimumstocklevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
  handleValidationErrors
];

// Request validation rules
// const validateRequest = [
//   body('itemtype')
//     .trim()
//     .notEmpty()
//     .withMessage('Item type is required'),
//   body('quantity')
//     .isInt({ min: 1 })
//     .withMessage('Quantity must be at least 1'),
//   body('purpose')
//     .trim()
//     .isLength({ min: 10, max: 500 })
//     .withMessage('Purpose must be between 10 and 500 characters'),
//   body('justification')
//     .trim()
//     .isLength({ min: 10, max: 1000 })
//     .withMessage('Justification must be between 10 and 1000 characters'),
//   body('expectedreturndate')
//     .optional()
//     .isISO8601()
//     .withMessage('Expected return date must be a valid date'),
//   handleValidationErrors
// ];

// Category validation rules
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('type')
    .isIn(['major', 'minor'])
    .withMessage('Type must be major or minor'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  handleValidationErrors
];

// Asset validation rules
const validateAsset = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Asset name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('manufacturer')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Manufacturer name cannot exceed 100 characters'),
  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Model name cannot exceed 100 characters'),
  body('unitprice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  handleValidationErrors
];

// Inventory transaction validation rules
const validateInventoryTransaction = [
  body('inventoryitemid')
    .isMongoId()
    .withMessage('Valid inventory item ID is required'),
  body('transactiontype')
    .isIn(['issue', 'return', 'adjustment', 'purchase', 'disposal', 'maintenance'])
    .withMessage('Transaction type must be issue, return, adjustment, purchase, disposal, or maintenance'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Purpose cannot exceed 500 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('expectedreturndate')
    .optional()
    .isISO8601()
    .withMessage('Expected return date must be a valid date'),
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be between 1 and 10000'),
  query('sort')
    .optional()
    .custom((value) => {
      // Allow MongoDB-style sort strings like '-field' or 'field'
      const sortPattern = /^-?[a-zA-Z][a-zA-Z0-9_]*$/;
      const simpleSortPattern = /^(asc|desc)$/i;
      return sortPattern.test(value) || simpleSortPattern.test(value);
    })
    .withMessage('Sort must be a valid field name or asc/desc'),
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  handleValidationErrors
];

// Date range validation
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  handleValidationErrors
];

// File upload validation
const validateFileUpload = (fieldName = 'file') => [
  body(fieldName)
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('File is required');
      }
      
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('File type must be JPEG, PNG, GIF, or PDF');
      }
      
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUser,
  validateUserUpdate,
  validateLogin,
  validateInventoryItem,
  // validateRequest,
  validateCategory,
  validateAsset,
  validateInventoryTransaction,
  validateObjectId,
  validatePagination,
  validateSearch,
  validateDateRange,
  validateFileUpload
};

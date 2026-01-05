const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IHub Inventory Management API',
      version: '1.0.0',
      description: 'A comprehensive REST API for inventory management system with user management, location tracking, and transaction monitoring.',
      contact: {
        name: 'IHub Team',
        email: 'support@ihub.com',
        url: 'https://ihub.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? ' http://31.97.60.2:5173/' 
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'name', 'password', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@ihub.com'
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            role: {
              type: 'string',
              enum: ['admin', 'stock-manager', 'employee'],
              description: 'User role',
              example: 'employee'
            },
            department: {
              type: 'string',
              description: 'User department',
              example: 'IT'
            },
            isactive: {
              type: 'boolean',
              description: 'User active status',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update date'
            }
          }
        },
        InventoryItem: {
          type: 'object',
          required: ['uniqueid', 'assetname', 'vendorname', 'quantityperitem', 'rateinclusivetax', 'totalcost', 'locationofitem'],
          properties: {
            _id: {
              type: 'string',
              description: 'Inventory item ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            uniqueid: {
              type: 'string',
              description: 'Unique item identifier',
              example: 'IT-LAP-001'
            },
            financialyear: {
              type: 'string',
              description: 'Financial year',
              example: '2024-25'
            },
            assetcategory: {
              type: 'string',
              description: 'Asset category name',
              example: 'Laptop'
            },
            assetcategoryid: {
              type: 'string',
              description: 'Asset category ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            assetid: {
              type: 'string',
              description: 'Asset ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            assetname: {
              type: 'string',
              description: 'Asset name',
              example: 'Dell Laptop'
            },
            specification: {
              type: 'string',
              description: 'Asset specifications',
              example: 'Intel i5, 8GB RAM, 256GB SSD'
            },
            makemodel: {
              type: 'string',
              description: 'Make and model',
              example: 'Dell Inspiron 15 3000'
            },
            productserialnumber: {
              type: 'string',
              description: 'Product serial number',
              example: 'DL123456789'
            },
            vendorname: {
              type: 'string',
              description: 'Vendor name',
              example: 'Dell Technologies'
            },
            quantityperitem: {
              type: 'number',
              description: 'Quantity per item',
              example: 1
            },
            rateinclusivetax: {
              type: 'number',
              description: 'Rate inclusive of tax',
              example: 45000
            },
            totalcost: {
              type: 'number',
              description: 'Total cost',
              example: 45000
            },
            locationofitem: {
              type: 'string',
              description: 'Location of item',
              example: 'IT Equipment Room'
            },
            locationid: {
              type: 'string',
              description: 'Location ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            balancequantityinstock: {
              type: 'number',
              description: 'Balance quantity in stock',
              example: 5
            },
            description: {
              type: 'string',
              description: 'Item description',
              example: 'Laptop for development work'
            },
            unitofmeasurement: {
              type: 'string',
              description: 'Unit of measurement',
              example: 'Pieces'
            },
            conditionofasset: {
              type: 'string',
              enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
              description: 'Condition of asset',
              example: 'excellent'
            },
            status: {
              type: 'string',
              enum: ['available', 'issued', 'maintenance', 'retired'],
              description: 'Item status',
              example: 'available'
            },
            minimumstocklevel: {
              type: 'number',
              description: 'Minimum stock level',
              example: 2
            },
            issuedto: {
              type: 'string',
              description: 'Currently issued to',
              example: 'John Doe'
            },
            issuedby: {
              type: 'string',
              description: 'Issued by',
              example: 'Admin'
            },
            issueddate: {
              type: 'string',
              format: 'date-time',
              description: 'Issue date'
            },
            expectedreturndate: {
              type: 'string',
              format: 'date-time',
              description: 'Expected return date'
            },
            dateofinvoice: {
              type: 'string',
              format: 'date',
              description: 'Date of invoice',
              example: '2024-01-15'
            },
            dateofentry: {
              type: 'string',
              format: 'date',
              description: 'Date of entry',
              example: '2024-01-16'
            },
            invoicenumber: {
              type: 'string',
              description: 'Invoice number',
              example: 'INV-2024-001'
            },
            lastmodifiedby: {
              type: 'string',
              description: 'Last modified by',
              example: 'Admin'
            },
            lastmodifieddate: {
              type: 'string',
              format: 'date-time',
              description: 'Last modified date'
            },
            createdby: {
              type: 'string',
              description: 'Created by user ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        Location: {
          type: 'object',
          required: ['name'],
          properties: {
            _id: {
              type: 'string',
              description: 'Location ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            name: {
              type: 'string',
              description: 'Location name',
              example: 'Storage Room A'
            },
            description: {
              type: 'string',
              description: 'Location description',
              example: 'Main storage room for general inventory'
            },
            address: {
              type: 'string',
              description: 'Location address',
              example: 'Building A, Ground Floor'
            },
            capacity: {
              type: 'number',
              description: 'Location capacity',
              example: 100
            },
            currentOccupancy: {
              type: 'number',
              description: 'Current occupancy',
              example: 25
            },
            locationType: {
              type: 'string',
              enum: ['storage', 'office', 'lab', 'workshop', 'warehouse', 'other'],
              description: 'Location type',
              example: 'storage'
            },
            floor: {
              type: 'string',
              description: 'Floor',
              example: 'Ground Floor'
            },
            building: {
              type: 'string',
              description: 'Building',
              example: 'Building A'
            },
            coordinates: {
              type: 'object',
              properties: {
                latitude: {
                  type: 'number',
                  description: 'Latitude',
                  example: 28.6139
                },
                longitude: {
                  type: 'number',
                  description: 'Longitude',
                  example: 77.2090
                }
              }
            },
            contactPerson: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Contact person name',
                  example: 'IT Manager'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'Contact person email',
                  example: 'it@ihub.com'
                },
                phone: {
                  type: 'string',
                  description: 'Contact person phone',
                  example: '+91-9876543210'
                }
              }
            },
            accessLevel: {
              type: 'string',
              enum: ['public', 'restricted', 'private'],
              description: 'Access level',
              example: 'public'
            },
            isActive: {
              type: 'boolean',
              description: 'Active status',
              example: true
            },
            isDefault: {
              type: 'boolean',
              description: 'Default location',
              example: false
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Location tags',
              example: ['main', 'storage', 'general']
            },
            notes: {
              type: 'string',
              description: 'Additional notes',
              example: 'Main storage area'
            },
            createdBy: {
              type: 'string',
              description: 'Created by user ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            lastModifiedBy: {
              type: 'string',
              description: 'Last modified by user ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        InventoryTransaction: {
          type: 'object',
          required: ['inventoryitemid', 'transactiontype', 'quantity', 'previousquantity', 'newquantity', 'issuedby'],
          properties: {
            _id: {
              type: 'string',
              description: 'Transaction ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            inventoryitemid: {
              type: 'string',
              description: 'Inventory item ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            transactiontype: {
              type: 'string',
              enum: ['issue', 'return', 'adjustment', 'purchase', 'disposal', 'maintenance'],
              description: 'Transaction type',
              example: 'issue'
            },
            quantity: {
              type: 'number',
              description: 'Transaction quantity',
              example: 1
            },
            previousquantity: {
              type: 'number',
              description: 'Previous quantity',
              example: 5
            },
            newquantity: {
              type: 'number',
              description: 'New quantity',
              example: 4
            },
            issuedto: {
              type: 'string',
              description: 'Issued to user ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            issuedby: {
              type: 'string',
              description: 'Issued by user ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            transactiondate: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction date'
            },
            purpose: {
              type: 'string',
              description: 'Transaction purpose',
              example: 'Development work'
            },
            notes: {
              type: 'string',
              description: 'Transaction notes',
              example: 'Item issued to employee'
            },
            requestid: {
              type: 'string',
              description: 'Related request ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            location: {
              type: 'string',
              description: 'Location',
              example: 'IT Equipment Room'
            },
            condition: {
              type: 'string',
              enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
              description: 'Item condition',
              example: 'excellent'
            },
            expectedreturndate: {
              type: 'string',
              format: 'date-time',
              description: 'Expected return date'
            },
            actualreturndate: {
              type: 'string',
              format: 'date-time',
              description: 'Actual return date'
            },
            unitcost: {
              type: 'number',
              description: 'Unit cost',
              example: 45000
            },
            totalcost: {
              type: 'number',
              description: 'Total cost',
              example: 45000
            },
            approvedby: {
              type: 'string',
              description: 'Approved by user ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            approvaldate: {
              type: 'string',
              format: 'date-time',
              description: 'Approval date'
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'completed', 'cancelled'],
              description: 'Transaction status',
              example: 'completed'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        Request: {
          type: 'object',
          required: ['employeeid', 'employeename', 'itemtype', 'quantity', 'purpose', 'justification'],
          properties: {
            _id: {
              type: 'string',
              description: 'Request ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            employeeid: {
              type: 'string',
              description: 'Employee ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            employeename: {
              type: 'string',
              description: 'Employee name',
              example: 'John Doe'
            },
            itemtype: {
              type: 'string',
              description: 'Item type',
              example: 'Laptop'
            },
            quantity: {
              type: 'number',
              description: 'Requested quantity',
              example: 1
            },
            purpose: {
              type: 'string',
              description: 'Request purpose',
              example: 'Development work'
            },
            justification: {
              type: 'string',
              description: 'Request justification',
              example: 'Need laptop for new project'
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected'],
              description: 'Request status',
              example: 'pending'
            },
            submittedat: {
              type: 'string',
              format: 'date-time',
              description: 'Submission date'
            },
            reviewedat: {
              type: 'string',
              format: 'date-time',
              description: 'Review date'
            },
            reviewedby: {
              type: 'string',
              description: 'Reviewed by user ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            reviewername: {
              type: 'string',
              description: 'Reviewer name',
              example: 'Admin'
            },
            remarks: {
              type: 'string',
              description: 'Review remarks',
              example: 'Approved for project work'
            },
            expectedreturndate: {
              type: 'string',
              format: 'date',
              description: 'Expected return date',
              example: '2024-12-31'
            },
            inventoryitemid: {
              type: 'string',
              description: 'Assigned inventory item ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Request priority',
              example: 'medium'
            },
            department: {
              type: 'string',
              description: 'Department',
              example: 'IT'
            },
            project: {
              type: 'string',
              description: 'Project name',
              example: 'Website Redesign'
            },
            estimatedcost: {
              type: 'number',
              description: 'Estimated cost',
              example: 45000
            },
            approvedquantity: {
              type: 'number',
              description: 'Approved quantity',
              example: 1
            },
            rejectionreason: {
              type: 'string',
              description: 'Rejection reason',
              example: 'Insufficient justification'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        Category: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            _id: {
              type: 'string',
              description: 'Category ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'Laptop'
            },
            type: {
              type: 'string',
              enum: ['major', 'minor'],
              description: 'Category type',
              example: 'major'
            },
            description: {
              type: 'string',
              description: 'Category description',
              example: 'Laptop computers and accessories'
            },
            isactive: {
              type: 'boolean',
              description: 'Active status',
              example: true
            },
            createdby: {
              type: 'string',
              description: 'Created by user ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        Asset: {
          type: 'object',
          required: ['name', 'category', 'manufacturer', 'model'],
          properties: {
            _id: {
              type: 'string',
              description: 'Asset ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            name: {
              type: 'string',
              description: 'Asset name',
              example: 'Dell Laptop'
            },
            description: {
              type: 'string',
              description: 'Asset description',
              example: 'Dell Inspiron 15 3000 Series'
            },
            category: {
              type: 'string',
              description: 'Category ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            manufacturer: {
              type: 'string',
              description: 'Manufacturer',
              example: 'Dell'
            },
            model: {
              type: 'string',
              description: 'Model',
              example: 'Inspiron 15 3000'
            },
            specifications: {
              type: 'string',
              description: 'Specifications',
              example: 'Intel i5, 8GB RAM, 256GB SSD'
            },
            unitprice: {
              type: 'number',
              description: 'Unit price',
              example: 45000
            },
            currency: {
              type: 'string',
              description: 'Currency',
              example: 'INR'
            },
            isactive: {
              type: 'boolean',
              description: 'Active status',
              example: true
            },
            createdby: {
              type: 'string',
              description: 'Created by user ID',
              example: '64f7b3b3b3b3b3b3b3b3b3b3'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            count: {
              type: 'number',
              description: 'Number of items in current page',
              example: 10
            },
            total: {
              type: 'number',
              description: 'Total number of items',
              example: 100
            },
            page: {
              type: 'number',
              description: 'Current page number',
              example: 1
            },
            pages: {
              type: 'number',
              description: 'Total number of pages',
              example: 10
            },
            data: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Array of items'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access denied. No token provided.'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Access denied. Insufficient permissions.'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Validation failed',
                error: 'Field validation error details'
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Internal server error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Users',
        description: 'User management operations'
      },
      {
        name: 'Inventory',
        description: 'Inventory item management'
      },
      {
        name: 'Locations',
        description: 'Location management'
      },
      {
        name: 'Requests',
        description: 'Item request management'
      },
      {
        name: 'Categories',
        description: 'Asset category management'
      },
      {
        name: 'Assets',
        description: 'Asset management'
      },
      {
        name: 'Transactions',
        description: 'Inventory transaction tracking'
      },
      {
        name: 'Dashboard',
        description: 'Dashboard analytics and statistics'
      },
      {
        name: 'Notifications',
        description: 'Notification management'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;

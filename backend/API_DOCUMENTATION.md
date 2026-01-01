# IHub Inventory Management API Documentation

## Overview

The IHub Inventory Management API is a comprehensive RESTful API built with Node.js, Express.js, and MongoDB. It provides complete functionality for managing inventory, users, requests, categories, assets, and transactions.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "count": 10,
  "total": 100,
  "page": 1,
  "pages": 10
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## User Roles

- **Admin**: Full access to all features
- **Stock Manager**: Can manage inventory, approve requests, manage categories and assets
- **Employee**: Can view inventory, create requests, manage own profile

## API Endpoints

### Authentication (`/api/auth`)

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "role": "employee",
  "department": "IT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "employee",
      "department": "IT",
      "isactive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
```

#### Update Profile
```http
PUT /api/auth/profile
```

**Request Body:**
```json
{
  "name": "John Smith",
  "department": "Marketing",
  "phone": "+1234567890",
  "address": "123 Main St",
  "bio": "Software developer"
}
```

#### Change Password
```http
PUT /api/auth/change-password
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /api/auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Users (`/api/users`)

#### Get All Users
```http
GET /api/users?page=1&limit=10&search=john&role=employee&isactive=true
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search term
- `role`: Filter by role
- `isactive`: Filter by active status

#### Get User by ID
```http
GET /api/users/:id
```

#### Create User (Admin only)
```http
POST /api/users
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "password123",
  "role": "employee",
  "department": "IT",
  "phone": "+1234567890"
}
```

#### Update User (Admin only)
```http
PUT /api/users/:id
```

#### Delete User (Admin only)
```http
DELETE /api/users/:id
```

#### Get User Statistics (Admin only)
```http
GET /api/users/stats
```

### Inventory (`/api/inventory`)

#### Get All Inventory Items
```http
GET /api/inventory?page=1&limit=10&search=laptop&status=available&category=60f7b3b3b3b3b3b3b3b3b3b3&stockStatus=low
```

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `search`: Search term
- `status`: Filter by status (available, issued, maintenance, retired)
- `category`: Filter by category ID
- `location`: Filter by location
- `condition`: Filter by condition
- `stockStatus`: Filter by stock status (low, out, available)

#### Get Inventory Item by ID
```http
GET /api/inventory/:id
```

#### Create Inventory Item (Admin/Stock Manager)
```http
POST /api/inventory
```

**Request Body:**
```json
{
  "uniqueid": "IT-LAP-002",
  "financialyear": "2024-25",
  "assetcategory": "Laptop",
  "assetcategoryid": "60f7b3b3b3b3b3b3b3b3b3b3",
  "assetid": "60f7b3b3b3b3b3b3b3b3b3b4",
  "assetname": "Dell Laptop",
  "specification": "Intel i7, 16GB RAM, 512GB SSD",
  "makemodel": "Dell Inspiron 15",
  "productserialnumber": "DL987654321",
  "vendorname": "Dell Technologies",
  "quantityperitem": 1,
  "rateinclusivetax": 75000,
  "totalcost": 75000,
  "locationofitem": "IT Department",
  "balancequantityinstock": 5,
  "description": "Laptop for development work",
  "unitofmeasurement": "Pieces",
  "conditionofasset": "excellent",
  "status": "available",
  "minimumstocklevel": 2,
  "dateofinvoice": "2024-01-15",
  "dateofentry": "2024-01-16",
  "invoicenumber": "INV-2024-002"
}
```

#### Update Inventory Item (Admin/Stock Manager)
```http
PUT /api/inventory/:id
```

#### Delete Inventory Item (Admin, Stock Manager)
```http
DELETE /api/inventory/:id
```

#### Issue Inventory Item (Admin/Stock Manager)
```http
POST /api/inventory/:id/issue
```

**Request Body:**
```json
{
  "issuedTo": "John Doe",
  "expectedReturnDate": "2024-02-15",
  "purpose": "Development Work",
  "notes": "Issued for project development"
}
```

#### Return Inventory Item (Admin/Stock Manager)
```http
POST /api/inventory/:id/return
```

**Request Body:**
```json
{
  "notes": "Item returned in good condition",
  "condition": "excellent"
}
```

#### Get Available Inventory Items
```http
GET /api/inventory/available
```

#### Get Low Stock Items
```http
GET /api/inventory/low-stock
```

#### Get Issued Items
```http
GET /api/inventory/issued
```

#### Get Inventory Statistics
```http
GET /api/inventory/stats
```

#### Get Inventory Transactions
```http
GET /api/inventory/:id/transactions?page=1&limit=10
```

#### Bulk Update Inventory Items (Admin/Stock Manager)
```http
PUT /api/inventory/bulk-update
```

**Request Body:**
```json
{
  "items": ["60f7b3b3b3b3b3b3b3b3b3b3", "60f7b3b3b3b3b3b3b3b3b3b4"],
  "updates": {
    "locationofitem": "New Location",
    "lastmodifiedby": "Admin"
  }
}
```

### Requests (`/api/requests`)

#### Get All Requests (Admin/Stock Manager)
```http
GET /api/requests?page=1&limit=10&search=laptop&status=pending&priority=high&department=IT
```

#### Get My Requests
```http
GET /api/requests/my-requests?page=1&limit=10
```

#### Create Request
```http
POST /api/requests
```

**Request Body:**
```json
{
  "itemtype": "Laptop",
  "quantity": 1,
  "purpose": "Development Work",
  "justification": "Need laptop for new project development",
  "expectedreturndate": "2024-02-15",
  "priority": "medium",
  "department": "IT",
  "project": "New Project",
  "estimatedcost": 75000
}
```

#### Get Request by ID
```http
GET /api/requests/:id
```

#### Update Request
```http
PUT /api/requests/:id
```

#### Delete Request
```http
DELETE /api/requests/:id
```

#### Approve Request (Admin/Stock Manager)
```http
PUT /api/requests/:id/approve
```

**Request Body:**
```json
{
  "remarks": "Approved for project work",
  "approvedQuantity": 1,
  "inventoryItemId": "60f7b3b3b3b3b3b3b3b3b3b3"
}
```

#### Reject Request (Admin/Stock Manager)
```http
PUT /api/requests/:id/reject
```

**Request Body:**
```json
{
  "rejectionReason": "Insufficient justification provided"
}
```

#### Get Pending Requests (Admin/Stock Manager)
```http
GET /api/requests/pending
```

#### Get Overdue Requests (Admin/Stock Manager)
```http
GET /api/requests/overdue
```

#### Get Requests by Employee (Admin/Stock Manager)
```http
GET /api/requests/employee/:employeeId?page=1&limit=10
```

#### Get Request Statistics
```http
GET /api/requests/stats
```

### Categories (`/api/categories`)

#### Get All Categories
```http
GET /api/categories?page=1&limit=10&search=computer&type=major&isactive=true
```

#### Get Category by ID
```http
GET /api/categories/:id
```

#### Create Category (Admin/Stock Manager)
```http
POST /api/categories
```

**Request Body:**
```json
{
  "name": "Computer Accessories",
  "type": "major",
  "description": "Computer accessories and peripherals",
  "parentcategory": "60f7b3b3b3b3b3b3b3b3b3b3",
  "depreciationrate": 20,
  "lifespanyears": 5,
  "tags": ["computer", "accessories", "peripherals"]
}
```

#### Update Category (Admin/Stock Manager)
```http
PUT /api/categories/:id
```

#### Delete Category (Admin only)
```http
DELETE /api/categories/:id
```

#### Get Active Categories
```http
GET /api/categories/active
```

#### Get Categories by Type
```http
GET /api/categories/type/:type
```

#### Get Major Categories
```http
GET /api/categories/major
```

#### Get Minor Categories
```http
GET /api/categories/minor
```

#### Get Categories with Inventory
```http
GET /api/categories/with-inventory
```

#### Add Asset Name to Category (Admin/Stock Manager)
```http
POST /api/categories/:id/assets
```

**Request Body:**
```json
{
  "assetName": "Wireless Mouse",
  "description": "Bluetooth enabled wireless mouse"
}
```

#### Remove Asset Name from Category (Admin/Stock Manager)
```http
DELETE /api/categories/:id/assets/:assetName
```

#### Toggle Asset Name Status (Admin/Stock Manager)
```http
PUT /api/categories/:id/assets/:assetName/toggle
```

#### Get Category Statistics
```http
GET /api/categories/stats
```

### Assets (`/api/assets`)

#### Get All Assets
```http
GET /api/assets?page=1&limit=10&search=dell&category=60f7b3b3b3b3b3b3b3b3b3b3&manufacturer=Dell&isactive=true
```

#### Get Asset by ID
```http
GET /api/assets/:id
```

#### Create Asset (Admin/Stock Manager)
```http
POST /api/assets
```

**Request Body:**
```json
{
  "name": "Dell Laptop",
  "description": "Dell Inspiron 15 3000 Series",
  "category": "60f7b3b3b3b3b3b3b3b3b3b3",
  "manufacturer": "Dell",
  "model": "Inspiron 15 3000",
  "specifications": "Intel i5, 8GB RAM, 256GB SSD",
  "unitprice": 45000,
  "currency": "INR",
  "tags": ["laptop", "dell", "business"],
  "purchaseDate": "2024-01-15",
  "warrantyPeriod": 36,
  "expectedLifespan": 5,
  "depreciationMethod": "straight-line",
  "depreciationRate": 20
}
```

#### Update Asset (Admin/Stock Manager)
```http
PUT /api/assets/:id
```

#### Delete Asset (Admin only)
```http
DELETE /api/assets/:id
```

#### Get Active Assets
```http
GET /api/assets/active
```

#### Get Assets by Category
```http
GET /api/assets/category/:categoryId
```

#### Get Assets with Inventory
```http
GET /api/assets/with-inventory
```

#### Search Assets
```http
GET /api/assets/search?q=dell
```

#### Get Asset Inventory Summary
```http
GET /api/assets/:id/inventory-summary
```

#### Toggle Asset Active Status (Admin/Stock Manager)
```http
PUT /api/assets/:id/toggle-active
```

#### Add Tag to Asset (Admin/Stock Manager)
```http
POST /api/assets/:id/tags
```

**Request Body:**
```json
{
  "tag": "gaming"
}
```

#### Remove Tag from Asset (Admin/Stock Manager)
```http
DELETE /api/assets/:id/tags/:tag
```

#### Get Asset Statistics
```http
GET /api/assets/stats
```

### Transactions (`/api/transactions`)

#### Get All Transactions (Admin/Stock Manager)
```http
GET /api/transactions?page=1&limit=10&type=issue&status=completed&startDate=2024-01-01&endDate=2024-01-31&userId=60f7b3b3b3b3b3b3b3b3b3b3
```

#### Get Transaction by ID
```http
GET /api/transactions/:id
```

#### Get Transactions by Item (Admin/Stock Manager)
```http
GET /api/transactions/item/:itemId?page=1&limit=10
```

#### Get Transactions by User (Admin/Stock Manager)
```http
GET /api/transactions/user/:userId?page=1&limit=10
```

#### Get Overdue Transactions (Admin/Stock Manager)
```http
GET /api/transactions/overdue
```

#### Get Pending Transactions (Admin/Stock Manager)
```http
GET /api/transactions/pending
```

#### Get Transaction Statistics
```http
GET /api/transactions/stats?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Monthly Transaction Report (Admin/Stock Manager)
```http
GET /api/transactions/monthly-report?year=2024&month=1
```

#### Approve Transaction (Admin/Stock Manager)
```http
PUT /api/transactions/:id/approve
```

#### Cancel Transaction (Admin/Stock Manager)
```http
PUT /api/transactions/:id/cancel
```

#### Complete Transaction (Admin/Stock Manager)
```http
PUT /api/transactions/:id/complete
```

#### Return Item from Transaction (Admin/Stock Manager)
```http
POST /api/transactions/:id/return
```

**Request Body:**
```json
{
  "condition": "excellent",
  "notes": "Item returned in good condition"
}
```

#### Get Transaction Audit Trail (Admin/Stock Manager)
```http
GET /api/transactions/audit-trail?page=1&limit=50&startDate=2024-01-01&endDate=2024-01-31&userId=60f7b3b3b3b3b3b3b3b3b3b3&type=issue
```

### Dashboard (`/api/dashboard`)

#### Get Dashboard Statistics
```http
GET /api/dashboard/stats
```

#### Get Inventory Overview
```http
GET /api/dashboard/inventory-overview
```

#### Get Request Overview
```http
GET /api/dashboard/request-overview
```

#### Get Transaction Overview
```http
GET /api/dashboard/transaction-overview
```

#### Get User Activity
```http
GET /api/dashboard/user-activity
```

### Notifications (`/api/notifications`)

#### Get Notifications
```http
GET /api/notifications
```

#### Get Notification Count
```http
GET /api/notifications/count
```

#### Mark Notification as Read
```http
PUT /api/notifications/:id/read
```

#### Mark All Notifications as Read
```http
PUT /api/notifications/read-all
```

#### Get Notification Settings
```http
GET /api/notifications/settings
```

#### Update Notification Settings
```http
PUT /api/notifications/settings
```

**Request Body:**
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "requestUpdates": true,
  "lowStockAlerts": true,
  "overdueAlerts": true,
  "systemMaintenance": true,
  "weeklyReports": false
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **File Uploads**: 10 uploads per minute
- **Search**: 30 searches per minute

## File Uploads

The API supports file uploads for:

- Profile pictures
- Inventory attachments
- Category images
- Asset images

**Supported formats**: JPEG, PNG, GIF, PDF
**Maximum size**: 10MB per file

## Pagination

Most list endpoints support pagination:

```
GET /api/inventory?page=1&limit=10&sort=-createdAt
```

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field and direction (e.g., `-createdAt` for descending)

## Search

Search functionality is available on most endpoints:

```
GET /api/inventory?search=laptop
```

## Filtering

Filter by specific fields:

```
GET /api/inventory?status=available&category=60f7b3b3b3b3b3b3b3b3b3b3
```

## Date Ranges

Filter by date ranges:

```
GET /api/transactions?startDate=2024-01-01&endDate=2024-01-31
```

## Webhooks (Future Feature)

The API will support webhooks for real-time notifications:

- Request status changes
- Low stock alerts
- Overdue items
- System maintenance

## SDKs (Future Feature)

Official SDKs will be available for:

- JavaScript/Node.js
- Python
- PHP
- Java

## Support

For API support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### Version 1.0.0
- Initial API release
- Complete CRUD operations for all entities
- Authentication and authorization
- File upload support
- Rate limiting and security features
- Comprehensive documentation

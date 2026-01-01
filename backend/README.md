# IHub Inventory Management Backend

A comprehensive Node.js backend API for inventory management system built with Express.js and MongoDB.

## 🚀 Features

- **User Management**: Role-based authentication (Admin, Stock Manager, Employee)
- **Inventory Management**: Complete CRUD operations for inventory items
- **Request System**: Employee request submission and approval workflow
- **Category Management**: Hierarchical category system for assets
- **Asset Management**: Asset catalog with specifications and metadata
- **Transaction Tracking**: Complete audit trail for inventory movements
- **File Uploads**: Support for profile pictures and document attachments
- **Rate Limiting**: Protection against abuse and spam
- **Security**: JWT authentication, password hashing, input validation
- **API Documentation**: Comprehensive REST API endpoints

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp config.env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ihub_inventory
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:1500
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (Admin/Stock Manager)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `GET /api/users/stats` - Get user statistics (Admin)

### Inventory
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get inventory item by ID
- `POST /api/inventory` - Create inventory item (Admin/Stock Manager)
- `PUT /api/inventory/:id` - Update inventory item (Admin/Stock Manager)
- `DELETE /api/inventory/:id` - Delete inventory item (Admin, Stock Manager)
- `POST /api/inventory/:id/issue` - Issue item (Admin/Stock Manager)
- `POST /api/inventory/:id/return` - Return item (Admin/Stock Manager)
- `GET /api/inventory/available` - Get available items
- `GET /api/inventory/low-stock` - Get low stock items
- `GET /api/inventory/stats` - Get inventory statistics

### Requests
- `GET /api/requests` - Get all requests (Admin/Stock Manager)
- `GET /api/requests/my-requests` - Get my requests
- `POST /api/requests` - Create request
- `PUT /api/requests/:id` - Update request
- `PUT /api/requests/:id/approve` - Approve request (Admin/Stock Manager)
- `PUT /api/requests/:id/reject` - Reject request (Admin/Stock Manager)
- `GET /api/requests/pending` - Get pending requests (Admin/Stock Manager)
- `GET /api/requests/stats` - Get request statistics

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin/Stock Manager)
- `PUT /api/categories/:id` - Update category (Admin/Stock Manager)
- `DELETE /api/categories/:id` - Delete category (Admin)
- `GET /api/categories/active` - Get active categories
- `GET /api/categories/with-inventory` - Get categories with inventory

### Assets
- `GET /api/assets` - Get all assets
- `GET /api/assets/:id` - Get asset by ID
- `POST /api/assets` - Create asset (Admin/Stock Manager)
- `PUT /api/assets/:id` - Update asset (Admin/Stock Manager)
- `DELETE /api/assets/:id` - Delete asset (Admin)
- `GET /api/assets/active` - Get active assets
- `GET /api/assets/with-inventory` - Get assets with inventory

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 User Roles

- **Admin**: Full access to all features
- **Stock Manager**: Can manage inventory, approve requests, manage categories and assets
- **Employee**: Can view inventory, create requests, manage own profile

## 📊 Database Models

### User
- Basic user information
- Role-based permissions
- Profile management
- Authentication tokens

### InventoryItem
- Item details and specifications
- Stock quantity tracking
- Issuance tracking
- Location and condition

### Request
- Employee requests
- Approval workflow
- Status tracking
- Comments and remarks

### Category
- Hierarchical categories
- Asset associations
- Active/inactive status

### Asset
- Asset specifications
- Manufacturer details
- Pricing information
- Lifecycle tracking

### InventoryTransaction
- Complete audit trail
- Transaction types (issue, return, adjustment)
- User tracking
- Timestamps

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive request validation
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **File Upload Security**: Type and size validation

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection
├── controllers/             # Route controllers
│   ├── authController.js
│   ├── userController.js
│   ├── inventoryController.js
│   ├── requestController.js
│   ├── categoryController.js
│   └── assetController.js
├── middleware/              # Custom middleware
│   ├── auth.js             # Authentication middleware
│   ├── validation.js       # Input validation
│   ├── errorHandler.js     # Error handling
│   ├── upload.js           # File upload handling
│   └── rateLimiter.js      # Rate limiting
├── models/                  # MongoDB models
│   ├── User.js
│   ├── InventoryItem.js
│   ├── Request.js
│   ├── Category.js
│   ├── Asset.js
│   └── InventoryTransaction.js
├── routes/                  # API routes
│   ├── auth.js
│   ├── users.js
│   ├── inventory.js
│   ├── requests.js
│   ├── categories.js
│   ├── assets.js
│   └── index.js
├── scripts/                 # Utility scripts
│   └── seedDatabase.js     # Database seeding
├── uploads/                 # File uploads directory
├── server.js               # Main server file
├── package.json
└── README.md
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set:

```env
MONGODB_URI=mongodb://your-mongodb-uri
PORT=5000
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-url.com
```

### Production Build
```bash
npm install --production
npm start
```

### Docker Deployment
```bash
# Build image
docker build -t ihub-inventory-backend .

# Run container
docker run -p 5000:5000 ihub-inventory-backend
```

## 📝 API Documentation

### Request/Response Format

All API responses follow this format:

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

### Error Response Format

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

### Pagination

Most list endpoints support pagination:

```
GET /api/inventory?page=1&limit=10&sort=-createdAt
```

### Search

Search functionality is available on most endpoints:

```
GET /api/inventory?search=laptop
```

### Filtering

Filter by specific fields:

```
GET /api/inventory?status=available&category=60f7b3b3b3b3b3b3b3b3b3b3
```

## 🔧 Development

### Adding New Features

1. Create model in `models/` directory
2. Create controller in `controllers/` directory
3. Create routes in `routes/` directory
4. Add validation in `middleware/validation.js`
5. Update main routes in `routes/index.js`

### Database Migrations

For schema changes, create migration scripts in `scripts/` directory.

### Code Style

- Use ESLint for code linting
- Follow consistent naming conventions
- Add comprehensive error handling
- Include input validation
- Write meaningful comments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added file upload support
- **v1.2.0** - Enhanced security features
- **v1.3.0** - Added transaction tracking

---

**Built with ❤️ by the IHub Team**

// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('ihub_inventory');

// Create application user
db.createUser({
  user: 'ihub_user',
  pwd: 'ihub_password',
  roles: [
    {
      role: 'readWrite',
      db: 'ihub_inventory'
    }
  ]
});

// Create collections with initial structure
db.createCollection('users');
db.createCollection('inventoryitems');
db.createCollection('requests');
db.createCollection('categories');
db.createCollection('assets');
db.createCollection('inventorytransactions');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isactive: 1 });

db.inventoryitems.createIndex({ uniqueid: 1 }, { unique: true });
db.inventoryitems.createIndex({ productserialnumber: 1 }, { unique: true });
db.inventoryitems.createIndex({ assetcategory: 1 });
db.inventoryitems.createIndex({ status: 1 });
db.inventoryitems.createIndex({ balancequantityinstock: 1 });
db.inventoryitems.createIndex({ issuedto: 1 });

db.requests.createIndex({ employeeid: 1 });
db.requests.createIndex({ status: 1 });
db.requests.createIndex({ submittedat: -1 });
db.requests.createIndex({ reviewedby: 1 });

db.categories.createIndex({ name: 1 }, { unique: true });
db.categories.createIndex({ type: 1 });
db.categories.createIndex({ isactive: 1 });

db.assets.createIndex({ name: 1 }, { unique: true });
db.assets.createIndex({ category: 1 });
db.assets.createIndex({ isactive: 1 });

db.inventorytransactions.createIndex({ inventoryitemid: 1 });
db.inventorytransactions.createIndex({ transactiontype: 1 });
db.inventorytransactions.createIndex({ transactiondate: -1 });
db.inventorytransactions.createIndex({ issuedto: 1 });
db.inventorytransactions.createIndex({ issuedby: 1 });

print('✅ MongoDB initialization completed successfully');
print('📊 Database: ihub_inventory');
print('👤 User: ihub_user');
print('🔑 Password: ihub_password');
print('📁 Collections created: users, inventoryitems, requests, categories, assets, inventorytransactions');
print('📈 Indexes created for optimal performance');

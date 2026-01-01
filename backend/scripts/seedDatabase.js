const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Asset = require('../models/Asset');
const InventoryItem = require('../models/InventoryItem');
const Location = require('../models/Location');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Seed data
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Asset.deleteMany({});
    await InventoryItem.deleteMany({});
    await Location.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Drop all indexes to prevent duplicate index errors
    try {
      await User.collection.dropIndexes();
      await Category.collection.dropIndexes();
      await Asset.collection.dropIndexes();
      await InventoryItem.collection.dropIndexes();
      await Location.collection.dropIndexes();
      console.log('🔧 Dropped existing indexes');
    } catch (error) {
      console.log('ℹ️  No indexes to drop or error dropping indexes (this is ok on first run)');
    }

    // Recreate indexes
    try {
      await User.createIndexes();
      await Category.createIndexes();
      await Asset.createIndexes();
      await InventoryItem.createIndexes();
      await Location.createIndexes();
      console.log('✨ Recreated indexes');
    } catch (error) {
      console.error('⚠️  Warning: Error creating indexes:', error.message);
    }

    // Create admin user
    const adminUser = await User.create({
      email: 'avnish@ihubiitmandi.in',
      name: 'System Administrator',
      password: 'avnish@',
      role: 'admin',
      department: 'IT',
      isactive: true
    });

    console.log('👤 Created admin user');

    // Create locations
    const locations = await Location.create([
      {
        name: 'Storage Room A',
        description: 'Main storage room for general inventory',
        address: 'Building A, Ground Floor',
        building: 'Building A',
        floor: 'Ground Floor',
        capacity: 100,
        currentOccupancy: 0,
        locationType: 'storage',
        accessLevel: 'public',
        isActive: true,
        isDefault: true,
        tags: ['main', 'storage', 'general'],
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      },
      {
        name: 'IT Equipment Room',
        description: 'Dedicated room for IT equipment and electronics',
        address: 'Building B, First Floor, Room 101',
        building: 'Building B',
        floor: 'First Floor',
        capacity: 50,
        currentOccupancy: 0,
        locationType: 'storage',
        accessLevel: 'restricted',
        isActive: true,
        isDefault: false,
        tags: ['it', 'electronics', 'restricted'],
        contactPerson: {
          name: 'IT Manager',
          email: 'it@ihub.com',
          phone: '+91-9876543210'
        },
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      },
      {
        name: 'Lab Equipment Storage',
        description: 'Storage for laboratory equipment and scientific instruments',
        address: 'Building C, Second Floor, Room 205',
        building: 'Building C',
        floor: 'Second Floor',
        capacity: 75,
        currentOccupancy: 0,
        locationType: 'lab',
        accessLevel: 'restricted',
        isActive: true,
        isDefault: false,
        tags: ['lab', 'scientific', 'instruments'],
        contactPerson: {
          name: 'Lab Manager',
          email: 'lab@ihub.com',
          phone: '+91-9876543211'
        },
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      },
      {
        name: 'Workshop Storage',
        description: 'Storage area for workshop tools and equipment',
        address: 'Building D, Ground Floor, Workshop Area',
        building: 'Building D',
        floor: 'Ground Floor',
        capacity: 60,
        currentOccupancy: 0,
        locationType: 'workshop',
        accessLevel: 'restricted',
        isActive: true,
        isDefault: false,
        tags: ['workshop', 'tools', 'equipment'],
        contactPerson: {
          name: 'Workshop Supervisor',
          email: 'workshop@ihub.com',
          phone: '+91-9876543212'
        },
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      },
      {
        name: 'Office Supplies Room',
        description: 'Storage for office supplies and stationery',
        address: 'Building A, First Floor, Room 102',
        building: 'Building A',
        floor: 'First Floor',
        capacity: 40,
        currentOccupancy: 0,
        locationType: 'office',
        accessLevel: 'public',
        isActive: true,
        isDefault: false,
        tags: ['office', 'supplies', 'stationery'],
        createdBy: adminUser._id,
        lastModifiedBy: adminUser._id
      }
    ]);

    console.log('📍 Created locations');

    // Create stock manager
    const stockManager = await User.create({
      email: 'printi@ihubiitmandi.in',
      name: 'Stock Manager',
      password: 'printi@',
      role: 'stock-manager',
      department: 'Operations',
      isactive: true
    });

    console.log('👤 Created stock manager');

    // Create employee
    const employee = await User.create({
      email: 'rohit@ihubiitmandi.in',
      name: 'Rohit Kumar',
      password: 'rohit@',
      role: 'employee',
      department: 'IT Department',
      isactive: true
    });

    console.log('👤 Created employee');

    // Create categories
    const categories = await Category.create([
      {
        name: 'Computer Mouse',
        type: 'major',
        description: 'Computer input devices including wired and wireless mice',
        isactive: true,
        createdby: adminUser._id,
        assetnames: [
          { name: 'Wireless Mouse', description: 'Bluetooth enabled wireless mouse', isactive: true },
          { name: 'Gaming Mouse', description: 'High precision gaming mouse', isactive: true },
          { name: 'Ergonomic Mouse', description: 'Comfortable ergonomic design', isactive: true }
        ]
      },
      {
        name: 'Laptop',
        type: 'major',
        description: 'Portable computers and laptops',
        isactive: true,
        createdby: adminUser._id,
        assetnames: [
          { name: 'Business Laptop', description: 'Professional business laptop', isactive: true },
          { name: 'Gaming Laptop', description: 'High performance gaming laptop', isactive: true },
          { name: 'Ultrabook', description: 'Lightweight ultrabook', isactive: true }
        ]
      },
      {
        name: 'Office Chair',
        type: 'major',
        description: 'Ergonomic office chairs and seating',
        isactive: true,
        createdby: adminUser._id,
        assetnames: [
          { name: 'Ergonomic Chair', description: 'Adjustable ergonomic office chair', isactive: true },
          { name: 'Executive Chair', description: 'Premium executive office chair', isactive: true },
          { name: 'Task Chair', description: 'Standard task office chair', isactive: true }
        ]
      },
      {
        name: 'Software License',
        type: 'minor',
        description: 'Software licenses and digital assets',
        isactive: true,
        createdby: adminUser._id,
        assetnames: [
          { name: 'Microsoft Office', description: 'Microsoft Office suite license', isactive: true },
          { name: 'Adobe Creative Suite', description: 'Adobe Creative Suite license', isactive: true },
          { name: 'Antivirus Software', description: 'Antivirus software license', isactive: true }
        ]
      }
    ]);

    console.log('📁 Created categories');

    // Create assets
    const assets = await Asset.create([
      {
        name: 'Dell Laptop',
        description: 'Dell Inspiron 15 3000 Series',
        category: categories[1]._id,
        manufacturer: 'Dell',
        model: 'Inspiron 15 3000',
        specifications: 'Intel i5, 8GB RAM, 256GB SSD',
        unitprice: 45000,
        currency: 'INR',
        isactive: true,
        createdby: adminUser._id
      },
      {
        name: 'Logitech Mouse',
        description: 'Logitech Wireless Mouse M705',
        category: categories[0]._id,
        manufacturer: 'Logitech',
        model: 'M705',
        specifications: 'Wireless, 2.4GHz, 3-year battery life',
        unitprice: 2500,
        currency: 'INR',
        isactive: true,
        createdby: adminUser._id
      },
      {
        name: 'Herman Miller Chair',
        description: 'Herman Miller Aeron Office Chair',
        category: categories[2]._id,
        manufacturer: 'Herman Miller',
        model: 'Aeron',
        specifications: 'Ergonomic, Height Adjustable, Lumbar Support',
        unitprice: 25000,
        currency: 'INR',
        isactive: true,
        createdby: adminUser._id
      }
    ]);

    console.log('🔧 Created assets');

    // Create inventory items
    const inventoryItems = await InventoryItem.create([
      {
        uniqueid: 'IT-LAP-001',
        financialyear: '2024-25',
        assetcategory: 'Laptop',
        assetcategoryid: categories[1]._id,
        assetid: assets[0]._id,
        assetname: 'Dell Laptop',
        specification: 'Intel i5, 8GB RAM, 256GB SSD',
        makemodel: 'Dell Inspiron 15 3000',
        productserialnumber: 'DL123456789',
        vendorname: 'Dell Technologies',
        quantityperitem: 1,
        rateinclusivetax: 45000,
        totalcost: 45000,
        locationofitem: 'IT Equipment Room',
        locationid: locations[1]._id,
        balancequantityinstock: 5,
        description: 'Laptop for development work',
        unitofmeasurement: 'Pieces',
        conditionofasset: 'excellent',
        status: 'available',
        minimumstocklevel: 2,
        dateofinvoice: new Date('2024-01-15'),
        dateofentry: new Date('2024-01-16'),
        invoicenumber: 'INV-2024-001',
        lastmodifiedby: adminUser.name,
        createdby: adminUser._id
      },
      {
        uniqueid: 'IT-MOU-001',
        financialyear: '2024-25',
        assetcategory: 'Computer Mouse',
        assetcategoryid: categories[0]._id,
        assetid: assets[1]._id,
        assetname: 'Logitech Mouse',
        specification: 'Wireless, 2.4GHz, 3-year battery life',
        makemodel: 'Logitech M705',
        productserialnumber: 'LG987654321',
        vendorname: 'Logitech',
        quantityperitem: 1,
        rateinclusivetax: 2500,
        totalcost: 2500,
        locationofitem: 'IT Equipment Room',
        locationid: locations[1]._id,
        balancequantityinstock: 20,
        description: 'Wireless mouse for office use',
        unitofmeasurement: 'Pieces',
        conditionofasset: 'excellent',
        status: 'available',
        minimumstocklevel: 5,
        dateofinvoice: new Date('2024-01-10'),
        dateofentry: new Date('2024-01-11'),
        invoicenumber: 'INV-2024-002',
        lastmodifiedby: adminUser.name,
        createdby: adminUser._id
      },
      {
        uniqueid: 'OFF-CHR-001',
        financialyear: '2024-25',
        assetcategory: 'Office Chair',
        assetcategoryid: categories[2]._id,
        assetid: assets[2]._id,
        assetname: 'Herman Miller Chair',
        specification: 'Ergonomic, Height Adjustable, Lumbar Support',
        makemodel: 'Herman Miller Aeron',
        productserialnumber: 'HM456789123',
        vendorname: 'Herman Miller',
        quantityperitem: 1,
        rateinclusivetax: 25000,
        totalcost: 25000,
        locationofitem: 'Office Supplies Room',
        locationid: locations[4]._id,
        balancequantityinstock: 10,
        description: 'Ergonomic office chair',
        unitofmeasurement: 'Pieces',
        conditionofasset: 'excellent',
        status: 'available',
        minimumstocklevel: 3,
        dateofinvoice: new Date('2024-01-05'),
        dateofentry: new Date('2024-01-06'),
        invoicenumber: 'INV-2024-003',
        lastmodifiedby: adminUser.name,
        createdby: adminUser._id
      }
    ]);

    console.log('📦 Created inventory items');

    // Update location occupancy based on inventory items
    for (const item of inventoryItems) {
      if (item.locationid) {
        try {
          const location = await Location.findById(item.locationid);
          if (location) {
            await location.incrementOccupancy(item.quantityperitem);
          }
        } catch (error) {
          console.error(`Error updating occupancy for location ${item.locationid}:`, error);
        }
      }
    }

    console.log('📍 Updated location occupancy');

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Seeded Data Summary:
👥 Users: 3 (1 admin, 1 stock-manager, 1 employee)
📍 Locations: 5 (1 default, 4 specialized)
📁 Categories: 4 (3 major, 1 minor)
🔧 Assets: 3
📦 Inventory Items: 3

🔑 Default Login Credentials:
Admin: avnish@ihubiitmandi.in / avnish@
Manager: printi@ihubiitmandi.in / printi@
Employee: rohit@ihubiitmandi.in / rohit@
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    throw error;
  }
};

// Run seeding
const runSeed = async () => {
  try {
    await connectDB();
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Check if this file is being run directly
if (require.main === module) {
  runSeed();
}

module.exports = { seedDatabase };
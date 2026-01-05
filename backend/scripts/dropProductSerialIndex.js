require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');

// Drop the unique index on productserialnumber if it exists
const dropProductSerialIndex = async () => {
  try {
    // Connect to MongoDB using the same connection string as the app
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri.replace(/\/\/.*@/, '//***@')); // Hide credentials in log

    // Get the collection
    const collection = InventoryItem.collection;
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Check if unique index on productserialnumber exists
    const productSerialIndex = indexes.find(
      idx => idx.key && idx.key.productserialnumber && idx.unique === true
    );

    if (productSerialIndex) {
      console.log('Found unique index on productserialnumber:', productSerialIndex.name);
      // Drop the index
      await collection.dropIndex(productSerialIndex.name);
      console.log(`✅ Dropped unique index: ${productSerialIndex.name}`);
    } else {
      console.log('✅ No unique index found on productserialnumber');
    }

    // Verify indexes after drop
    const indexesAfter = await collection.indexes();
    console.log('Indexes after drop:', indexesAfter.map(idx => idx.name));

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error dropping index:', error);
    // If index doesn't exist, that's fine
    if (error.code === 27 || error.message.includes('index not found')) {
      console.log('✅ Index does not exist (this is fine)');
      await mongoose.disconnect();
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
};

// Run if called directly
if (require.main === module) {
  dropProductSerialIndex();
}

module.exports = dropProductSerialIndex;


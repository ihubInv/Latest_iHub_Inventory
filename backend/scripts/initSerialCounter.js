const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const SerialNumberCounter = require('../models/SerialNumberCounter');

// Initialize the serial number counter based on existing inventory items
const initSerialCounter = async () => {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/your-database';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Count existing inventory items
    const totalItems = await InventoryItem.countDocuments();
    console.log(`Found ${totalItems} existing inventory items`);

    // Get current counter value
    const currentCounter = await SerialNumberCounter.getCurrentSequence();
    console.log(`Current counter value: ${currentCounter}`);

    // If counter is 0 or less than total items, sync it
    if (currentCounter < totalItems) {
      await SerialNumberCounter.findByIdAndUpdate(
        'global',
        { sequenceValue: totalItems },
        { upsert: true, new: true }
      );
      console.log(`✅ Counter initialized/synced to ${totalItems}`);
      console.log(`Next serial number will be: ${(totalItems + 1).toString().padStart(3, '0')}`);
    } else {
      console.log(`✅ Counter is already at ${currentCounter}, no sync needed`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing counter:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initSerialCounter();
}

module.exports = initSerialCounter;


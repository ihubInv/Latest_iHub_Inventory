const mongoose = require('mongoose');

const serialNumberCounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    default: 'global'
  },
  sequenceValue: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

/**
 * Get and increment the global serial number counter atomically
 * 
 * This method automatically increments the serial number for each new asset.
 * The serial number reflects the total asset count and increments sequentially:
 * - First asset: 001
 * - Second asset: 002
 * - Third asset: 003
 * - And so on...
 * 
 * The counter is atomic and thread-safe, ensuring no duplicates even under
 * concurrent asset creation requests.
 * 
 * @returns {Promise<number>} The next sequential serial number
 */
serialNumberCounterSchema.statics.getNextSequence = async function() {
  const counter = await this.findByIdAndUpdate(
    'global',
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequenceValue;
};

// Static method to get current sequence value without incrementing
serialNumberCounterSchema.statics.getCurrentSequence = async function() {
  const counter = await this.findById('global');
  return counter ? counter.sequenceValue : 0;
};

module.exports = mongoose.model('SerialNumberCounter', serialNumberCounterSchema);


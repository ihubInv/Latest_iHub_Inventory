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

// Static method to get and increment the counter atomically
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


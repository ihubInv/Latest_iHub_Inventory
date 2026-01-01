const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Location name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  capacity: {
    type: Number,
    default: 50,
    min: [1, 'Capacity must be at least 1'],
    max: [10000, 'Capacity cannot exceed 10000']
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: [0, 'Current occupancy cannot be negative']
  },
  locationType: {
    type: String,
    enum: ['storage', 'office', 'lab', 'workshop', 'warehouse', 'other'],
    default: 'storage'
  },
  floor: {
    type: String,
    trim: true,
    maxlength: [50, 'Floor cannot exceed 50 characters']
  },
  building: {
    type: String,
    trim: true,
    maxlength: [100, 'Building cannot exceed 100 characters']
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  contactPerson: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    }
  },
  accessLevel: {
    type: String,
    enum: ['public', 'restricted', 'private'],
    default: 'public'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
locationSchema.index({ isActive: 1 });
locationSchema.index({ locationType: 1 });
locationSchema.index({ building: 1, floor: 1 });
locationSchema.index({ tags: 1 });
locationSchema.index({ createdBy: 1 });

// Compound indexes
locationSchema.index({ isActive: 1, locationType: 1 });
locationSchema.index({ building: 1, floor: 1, isActive: 1 });

// Virtual for occupancy percentage
locationSchema.virtual('occupancyPercentage').get(function() {
  if (this.capacity <= 0) return 0;
  return Math.round((this.currentOccupancy / this.capacity) * 100);
});

// Virtual for availability status
locationSchema.virtual('availabilityStatus').get(function() {
  const percentage = this.occupancyPercentage;
  if (percentage >= 90) return 'Full';
  if (percentage >= 75) return 'Nearly Full';
  if (percentage >= 50) return 'Moderate';
  if (percentage >= 25) return 'Available';
  return 'Empty';
});

// Virtual for full address
locationSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.building) parts.push(this.building);
  if (this.floor) parts.push(`Floor ${this.floor}`);
  if (this.address) parts.push(this.address);
  return parts.join(', ') || 'Address not specified';
});

// Pre-save middleware to ensure only one default location
locationSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default flag from other locations
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  next();
});

// Pre-save middleware to update lastModifiedBy
locationSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.lastModifiedBy || this.createdBy;
  }
  next();
});

// Static method to find active locations
locationSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find locations by type
locationSchema.statics.findByType = function(type) {
  return this.find({ locationType: type, isActive: true }).sort({ name: 1 });
};

// Static method to find default location
locationSchema.statics.findDefault = function() {
  return this.findOne({ isDefault: true, isActive: true });
};

// Static method to find locations with available capacity
locationSchema.statics.findWithCapacity = function(minCapacity = 1) {
  return this.find({
    isActive: true,
    $expr: {
      $gte: [{ $subtract: ['$capacity', '$currentOccupancy'] }, minCapacity]
    }
  }).sort({ name: 1 });
};

// Static method to get location statistics
locationSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalLocations: { $sum: 1 },
        activeLocations: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        totalCapacity: { $sum: '$capacity' },
        totalOccupancy: { $sum: '$currentOccupancy' },
        averageOccupancy: { $avg: '$currentOccupancy' }
      }
    },
    {
      $project: {
        _id: 0,
        totalLocations: 1,
        activeLocations: 1,
        inactiveLocations: { $subtract: ['$totalLocations', '$activeLocations'] },
        totalCapacity: 1,
        totalOccupancy: 1,
        availableCapacity: { $subtract: ['$totalCapacity', '$totalOccupancy'] },
        averageOccupancy: { $round: ['$averageOccupancy', 2] },
        utilizationPercentage: {
          $round: [
            { $multiply: [{ $divide: ['$totalOccupancy', '$totalCapacity'] }, 100] },
            2
          ]
        }
      }
    }
  ]);
};

// Instance method to update occupancy
locationSchema.methods.updateOccupancy = function(newOccupancy) {
  if (newOccupancy < 0) {
    throw new Error('Occupancy cannot be negative');
  }
  if (newOccupancy > this.capacity) {
    throw new Error('Occupancy cannot exceed capacity');
  }
  
  this.currentOccupancy = newOccupancy;
  return this.save();
};

// Instance method to increment occupancy
locationSchema.methods.incrementOccupancy = function(amount = 1) {
  const newOccupancy = this.currentOccupancy + amount;
  if (newOccupancy > this.capacity) {
    throw new Error('Cannot add items: location at capacity');
  }
  return this.updateOccupancy(newOccupancy);
};

// Instance method to decrement occupancy
locationSchema.methods.decrementOccupancy = function(amount = 1) {
  const newOccupancy = Math.max(0, this.currentOccupancy - amount);
  return this.updateOccupancy(newOccupancy);
};

// Instance method to check if location has capacity
locationSchema.methods.hasCapacity = function(amount = 1) {
  return (this.currentOccupancy + amount) <= this.capacity;
};

// Instance method to get available capacity
locationSchema.methods.getAvailableCapacity = function() {
  return Math.max(0, this.capacity - this.currentOccupancy);
};

module.exports = mongoose.model('Location', locationSchema);

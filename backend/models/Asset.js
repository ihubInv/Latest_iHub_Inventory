const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Asset name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  assetcategory: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  isactive: {
    type: Boolean,
    default: true
  },
  createdby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Additional fields for better asset management
  assetcode: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  specifications: {
    type: String,
    trim: true
  },
  unitprice: {
    type: Number,
    min: [0, 'Unit price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Asset lifecycle information
  purchaseDate: {
    type: Date
  },
  warrantyPeriod: {
    type: Number, // in months
    min: [0, 'Warranty period cannot be negative']
  },
  expectedLifespan: {
    type: Number, // in years
    min: [0, 'Expected lifespan cannot be negative']
  },
  depreciationMethod: {
    type: String,
    enum: ['straight-line', 'declining-balance', 'sum-of-years', 'units-of-production'],
    default: 'straight-line'
  },
  depreciationRate: {
    type: Number,
    min: [0, 'Depreciation rate cannot be negative'],
    max: [100, 'Depreciation rate cannot exceed 100%']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
assetSchema.index({ isactive: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ createdby: 1 });
assetSchema.index({ manufacturer: 1 });

// Virtual for inventory item count
assetSchema.virtual('inventoryItemCount', {
  ref: 'InventoryItem',
  localField: '_id',
  foreignField: 'assetid',
  count: true
});

// Virtual for total value
assetSchema.virtual('totalValue', {
  ref: 'InventoryItem',
  localField: '_id',
  foreignField: 'assetid',
  options: { match: { status: { $in: ['available', 'issued'] } } }
});

// Pre-save middleware to generate asset code
assetSchema.pre('save', function(next) {
  if (!this.assetcode) {
    // Generate asset code from name
    const code = this.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10)
      .toUpperCase();
    this.assetcode = code;
  }
  next();
});

// Static method to find active assets
assetSchema.statics.findActive = function() {
  return this.find({ isactive: true }).sort({ name: 1 });
};

// Static method to find assets by category
assetSchema.statics.findByCategory = function(categoryId) {
  return this.find({ category: categoryId, isactive: true }).sort({ name: 1 });
};

// Static method to find assets with inventory
assetSchema.statics.findWithInventory = function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'inventoryitems',
        localField: '_id',
        foreignField: 'assetid',
        as: 'inventoryItems'
      }
    },
    {
      $match: {
        'inventoryItems.0': { $exists: true },
        isactive: true
      }
    },
    {
      $addFields: {
        totalItems: { $size: '$inventoryItems' },
        totalValue: { $sum: '$inventoryItems.totalcost' },
        availableItems: {
          $size: {
            $filter: {
              input: '$inventoryItems',
              cond: { $eq: ['$$this.status', 'available'] }
            }
          }
        }
      }
    },
    {
      $sort: { name: 1 }
    }
  ]);
};

// Static method to search assets
assetSchema.statics.searchAssets = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { name: regex },
      { description: regex },
      { manufacturer: regex },
      { model: regex },
      { assetcode: regex }
    ],
    isactive: true
  }).sort({ name: 1 });
};

// Instance method to get inventory summary
assetSchema.methods.getInventorySummary = function() {
  return this.constructor.aggregate([
    { $match: { _id: this._id } },
    {
      $lookup: {
        from: 'inventoryitems',
        localField: '_id',
        foreignField: 'assetid',
        as: 'inventoryItems'
      }
    },
    {
      $addFields: {
        totalItems: { $size: '$inventoryItems' },
        availableItems: {
          $size: {
            $filter: {
              input: '$inventoryItems',
              cond: { $eq: ['$$this.status', 'available'] }
            }
          }
        },
        issuedItems: {
          $size: {
            $filter: {
              input: '$inventoryItems',
              cond: { $eq: ['$$this.status', 'issued'] }
            }
          }
        },
        totalValue: { $sum: '$inventoryItems.totalcost' }
      }
    }
  ]);
};

// Instance method to toggle active status
assetSchema.methods.toggleActive = function() {
  this.isactive = !this.isactive;
  return this.save();
};

// Instance method to add tag
assetSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove tag
assetSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

module.exports = mongoose.model('Asset', assetSchema);

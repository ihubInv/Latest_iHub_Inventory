const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['major', 'minor'],
    required: [true, 'Category type is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
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
  // Additional fields for better categorization
  parentcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  categorycode: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  depreciationrate: {
    type: Number,
    min: [0, 'Depreciation rate cannot be negative'],
    max: [100, 'Depreciation rate cannot exceed 100%']
  },
  lifespanyears: {
    type: Number,
    min: [0, 'Lifespan cannot be negative']
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Asset names associated with this category
  assetnames: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    isactive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ type: 1 });
categorySchema.index({ isactive: 1 });
categorySchema.index({ createdby: 1 });

// Virtual for asset count
categorySchema.virtual('assetCount', {
  ref: 'Asset',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Virtual for inventory item count
categorySchema.virtual('inventoryItemCount', {
  ref: 'InventoryItem',
  localField: '_id',
  foreignField: 'assetcategoryid',
  count: true
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentcategory'
});

// Pre-save middleware to generate category code
categorySchema.pre('save', function(next) {
  if (!this.categorycode) {
    // Generate category code from name
    const code = this.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10)
      .toUpperCase();
    this.categorycode = code;
  }
  next();
});

// Static method to find active categories
categorySchema.statics.findActive = function() {
  return this.find({ isactive: true }).sort({ name: 1 });
};

// Static method to find categories by type
categorySchema.statics.findByType = function(type) {
  return this.find({ type, isactive: true }).sort({ name: 1 });
};

// Static method to find major categories
categorySchema.statics.findMajor = function() {
  return this.find({ type: 'major', isactive: true }).sort({ name: 1 });
};

// Static method to find minor categories
categorySchema.statics.findMinor = function() {
  return this.find({ type: 'minor', isactive: true }).sort({ name: 1 });
};

// Static method to find categories with inventory
categorySchema.statics.findWithInventory = function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'inventoryitems',
        localField: '_id',
        foreignField: 'assetcategoryid',
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
        totalValue: { $sum: '$inventoryItems.totalcost' }
      }
    },
    {
      $sort: { name: 1 }
    }
  ]);
};

// Instance method to add asset name
categorySchema.methods.addAssetName = function(assetName, description) {
  const existingAsset = this.assetnames.find(asset => 
    asset.name.toLowerCase() === assetName.toLowerCase()
  );
  
  if (!existingAsset) {
    this.assetnames.push({
      name: assetName,
      description: description || '',
      isactive: true
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to remove asset name
categorySchema.methods.removeAssetName = function(assetName) {
  this.assetnames = this.assetnames.filter(asset => 
    asset.name.toLowerCase() !== assetName.toLowerCase()
  );
  return this.save();
};

// Instance method to toggle asset name status
categorySchema.methods.toggleAssetName = function(assetName) {
  const asset = this.assetnames.find(asset => 
    asset.name.toLowerCase() === assetName.toLowerCase()
  );
  
  if (asset) {
    asset.isactive = !asset.isactive;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to get active asset names
categorySchema.methods.getActiveAssetNames = function() {
  return this.assetnames.filter(asset => asset.isactive);
};

module.exports = mongoose.model('Category', categorySchema);

const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  uniqueid: {
    type: String,
    // required: [true, 'Unique ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  financialyear: {
    type: String,
    // // required: [true, 'Financial year is required'],
    trim: true
  },
  assetcategory: {
    type: String,
    // // required: [true, 'Asset category is required'],
    trim: true
  },
  assetcategoryid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    // required: true
  },
  assetid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  assetname: {
    type: String,
    // // required: [true, 'Asset name is required'],
    trim: true
  },
  specification: {
    type: String,
    trim: true
  },
  makemodel: {
    type: String,
    trim: true
  },
  productserialnumber: {
    type: String,
    trim: true
    // unique and sparse index defined below
  },
  vendorname: {
    type: String,
    // // required: [true, 'Vendor name is required'],
    trim: true
  },
  quantityperitem: {
    type: Number,
    // // required: [true, 'Quantity per item is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  rateinclusivetax: {
    type: Number,
    // // required: [true, 'Rate inclusive of tax is required'],
    min: [0, 'Rate cannot be negative']
  },
  totalcost: {
    type: Number,
    // // required: [true, 'Total cost is required'],
    min: [0, 'Total cost cannot be negative']
  },
  locationofitem: {
    type: String,
    // // required: [true, 'Location of item is required'],
    trim: true
  },
  locationid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  },
  balancequantityinstock: {
    type: Number,
    // // required: [true, 'Balance quantity in stock is required'],
    min: [0, 'Balance quantity cannot be negative'],
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  unitofmeasurement: {
    type: String,
    default: 'Pieces',
    trim: true
  },
  conditionofasset: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    default: 'excellent'
  },
  status: {
    type: String,
    enum: ['available', 'issued', 'maintenance', 'retired'],
    default: 'available'
  },
  minimumstocklevel: {
    type: Number,
    default: 0,
    min: [0, 'Minimum stock level cannot be negative']
  },
  // Issuance tracking fields
  issuedto: {
    type: String,
    trim: true
  },
  issuedby: {
    type: String,
    trim: true
  },
  issueddate: {
    type: Date
  },
  dateofissue: {
    type: Date
  },
  expectedreturndate: {
    type: Date
  },
  // Additional fields
  dateofinvoice: {
    type: Date,
    // // required: [true, 'Date of invoice is required']
  },
  dateofentry: {
    type: Date,
    // // required: [true, 'Date of entry is required']
  },
  invoicenumber: {
    type: String,
    // // required: [true, 'Invoice number is required'],
    trim: true
  },
  depreciationmethod: {
    type: String,
    trim: true
  },
  warrantyinformation: {
    type: String,
    trim: true
  },
  maintenanceschedule: {
    type: String,
    trim: true
  },
  purchaseordernumber: {
    type: String,
    trim: true
  },
  expectedlifespan: {
    type: String,
    trim: true
  },
  annualmanagementcharge: {
    type: Number,
    min: [0, 'Annual management charge cannot be negative']
  },
  attachments: [{
    name: {
      type: String,
      // required: true
    },
    url: {
      type: String,
      // required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastmodifiedby: {
    type: String,
    // // required: [true, 'Last modified by is required'],
    trim: true
  },
  lastmodifieddate: {
    type: Date,
    default: Date.now
  },
  createdby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
inventoryItemSchema.index({ assetcategory: 1 });
inventoryItemSchema.index({ status: 1 });
inventoryItemSchema.index({ balancequantityinstock: 1 });
inventoryItemSchema.index({ issuedto: 1 });
inventoryItemSchema.index({ createdby: 1 });
inventoryItemSchema.index({ locationid: 1 });
inventoryItemSchema.index({ locationofitem: 1 });
inventoryItemSchema.index({ productserialnumber: 1 }, { unique: true, sparse: true });

// Virtual for stock status
inventoryItemSchema.virtual('stockStatus').get(function() {
  if (this.balancequantityinstock <= 0) {
    return 'Out of Stock';
  } else if (this.balancequantityinstock <= this.minimumstocklevel) {
    return 'Low Stock';
  } else {
    return 'In Stock';
  }
});

// Virtual for days since issued
inventoryItemSchema.virtual('daysSinceIssued').get(function() {
  if (this.issueddate) {
    const now = new Date();
    const issued = new Date(this.issueddate);
    return Math.floor((now - issued) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Pre-save middleware to update lastmodifieddate
inventoryItemSchema.pre('save', function(next) {
  this.lastmodifieddate = new Date();
  next();
});

// Static method to find available items
inventoryItemSchema.statics.findAvailable = function() {
  return this.find({ status: 'available', balancequantityinstock: { $gt: 0 } });
};

// Static method to find low stock items
inventoryItemSchema.statics.findLowStock = function() {
  return this.find({
    $expr: {
      $lte: ['$balancequantityinstock', '$minimumstocklevel']
    },
    status: 'available'
  });
};

// Static method to find issued items
inventoryItemSchema.statics.findIssued = function() {
  return this.find({ status: 'issued' });
};

// Static method to find items by category
inventoryItemSchema.statics.findByCategory = function(categoryId) {
  return this.find({ assetcategoryid: categoryId });
};

// Instance method to issue item
inventoryItemSchema.methods.issueItem = function(issuedTo, issuedBy, expectedReturnDate) {
  if (this.balancequantityinstock <= 0) {
    throw new Error('Item is out of stock');
  }

  this.balancequantityinstock -= 1;
  this.status = 'issued';
  this.issuedto = issuedTo;
  this.issuedby = issuedBy;
  this.issueddate = new Date();
  this.dateofissue = this.issueddate;
  this.expectedreturndate = expectedReturnDate;
  this.lastmodifieddate = new Date();

  return this.save();
};

// Instance method to return item
inventoryItemSchema.methods.returnItem = function(returnedBy) {
  this.balancequantityinstock += 1;
  this.status = 'available';
  this.issuedto = undefined;
  this.issuedby = undefined;
  this.issueddate = undefined;
  this.dateofissue = undefined;
  this.expectedreturndate = undefined;
  this.lastmodifieddate = new Date();
  
  return this.save();
};

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);

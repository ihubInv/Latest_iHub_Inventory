const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  employeeid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee ID is required']
  },
  employeename: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true
  },
  itemtype: {
    type: String,
    required: [true, 'Item type is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters']
  },
  justification: {
    type: String,
    required: [true, 'Justification is required'],
    trim: true,
    maxlength: [1000, 'Justification cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedat: {
    type: Date,
    default: Date.now
  },
  reviewedat: {
    type: Date
  },
  reviewedby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewername: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  expectedreturndate: {
    type: Date
  },
  inventoryitemid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem'
  },
  // Additional fields for better tracking
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  department: {
    type: String,
    trim: true
  },
  project: {
    type: String,
    trim: true
  },
  estimatedcost: {
    type: Number,
    min: [0, 'Estimated cost cannot be negative']
  },
  approvedquantity: {
    type: Number,
    min: [0, 'Approved quantity cannot be negative']
  },
  rejectionreason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
requestSchema.index({ employeeid: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ submittedat: -1 });
requestSchema.index({ reviewedby: 1 });
requestSchema.index({ inventoryitemid: 1 });

// Virtual for days since submission
requestSchema.virtual('daysSinceSubmission').get(function() {
  const now = new Date();
  const submitted = new Date(this.submittedat);
  return Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
});

// Virtual for days since review
requestSchema.virtual('daysSinceReview').get(function() {
  if (this.reviewedat) {
    const now = new Date();
    const reviewed = new Date(this.reviewedat);
    return Math.floor((now - reviewed) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for request age status
requestSchema.virtual('ageStatus').get(function() {
  const days = this.daysSinceSubmission;
  if (days <= 1) return 'new';
  if (days <= 3) return 'recent';
  if (days <= 7) return 'pending';
  return 'overdue';
});

// Pre-save middleware to update timestamps
requestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.reviewedat) {
    this.reviewedat = new Date();
  }
  next();
});

// Static method to find pending requests
requestSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ submittedat: -1 });
};

// Static method to find requests by employee
requestSchema.statics.findByEmployee = function(employeeId) {
  return this.find({ employeeid: employeeId }).sort({ submittedat: -1 });
};

// Static method to find requests by status
requestSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ submittedat: -1 });
};

// Static method to find overdue requests
requestSchema.statics.findOverdue = function() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return this.find({
    status: 'pending',
    submittedat: { $lt: sevenDaysAgo }
  }).sort({ submittedat: 1 });
};

// Static method to find requests by reviewer
requestSchema.statics.findByReviewer = function(reviewerId) {
  return this.find({ reviewedby: reviewerId }).sort({ reviewedat: -1 });
};

// Static method to get request statistics
requestSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);
};

// Instance method to approve request
requestSchema.methods.approve = function(reviewerId, reviewerName, remarks, approvedQuantity) {
  this.status = 'approved';
  this.reviewedby = reviewerId;
  this.reviewername = reviewerName;
  this.reviewedat = new Date();
  this.remarks = remarks;
  this.approvedquantity = approvedQuantity || this.quantity;
  
  return this.save();
};

// Instance method to reject request
requestSchema.methods.reject = function(reviewerId, reviewerName, rejectionReason) {
  this.status = 'rejected';
  this.reviewedby = reviewerId;
  this.reviewername = reviewerName;
  this.reviewedat = new Date();
  this.rejectionreason = rejectionReason;
  
  return this.save();
};

// Instance method to assign inventory item
requestSchema.methods.assignInventoryItem = function(inventoryItemId) {
  this.inventoryitemid = inventoryItemId;
  return this.save();
};

module.exports = mongoose.model('Request', requestSchema);

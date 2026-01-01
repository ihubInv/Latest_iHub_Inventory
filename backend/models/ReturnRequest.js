const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
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
  inventoryitemid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: [true, 'Inventory item ID is required']
  },
  assetname: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true
  },
  returnreason: {
    type: String,
    required: [true, 'Return reason is required'],
    trim: true
  },
  conditiononreturn: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    required: [true, 'Condition on return is required'],
    default: 'good'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedat: {
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
  approvalremarks: {
    type: String,
    trim: true
  },
  rejectionreason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
returnRequestSchema.index({ employeeid: 1 });
returnRequestSchema.index({ inventoryitemid: 1 });
returnRequestSchema.index({ status: 1 });
returnRequestSchema.index({ requestedat: -1 });

// Static method to find pending return requests
returnRequestSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort('-requestedat');
};

// Static method to find return requests by employee
returnRequestSchema.statics.findByEmployee = function(employeeId) {
  return this.find({ employeeid: employeeId }).sort('-requestedat');
};

// Instance method to approve return request
returnRequestSchema.methods.approve = function(reviewerId, reviewerName, remarks) {
  this.status = 'approved';
  this.reviewedby = reviewerId;
  this.reviewername = reviewerName;
  this.reviewedat = new Date();
  this.approvalremarks = remarks;
  return this.save();
};

// Instance method to reject return request
returnRequestSchema.methods.reject = function(reviewerId, reviewerName, rejectionReason) {
  this.status = 'rejected';
  this.reviewedby = reviewerId;
  this.reviewername = reviewerName;
  this.reviewedat = new Date();
  this.rejectionreason = rejectionReason;
  return this.save();
};

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);

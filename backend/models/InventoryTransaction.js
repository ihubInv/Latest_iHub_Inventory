const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  inventoryitemid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: [true, 'Inventory item ID is required']
  },
  transactiontype: {
    type: String,
    enum: ['issue', 'return', 'adjustment', 'purchase', 'disposal', 'maintenance'],
    required: [true, 'Transaction type is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  previousquantity: {
    type: Number,
    required: [true, 'Previous quantity is required'],
    min: [0, 'Previous quantity cannot be negative']
  },
  newquantity: {
    type: Number,
    required: [true, 'New quantity is required'],
    min: [0, 'New quantity cannot be negative']
  },
  issuedto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  issuedby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Issued by is required']
  },
  transactiondate: {
    type: Date,
    default: Date.now
  },
  purpose: {
    type: String,
    trim: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  // Additional fields for better tracking
  requestid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  location: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'damaged'],
    default: 'excellent'
  },
  expectedreturndate: {
    type: Date
  },
  actualreturndate: {
    type: Date
  },
  // Cost tracking
  unitcost: {
    type: Number,
    min: [0, 'Unit cost cannot be negative']
  },
  totalcost: {
    type: Number,
    min: [0, 'Total cost cannot be negative']
  },
  // Approval tracking
  approvedby: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvaldate: {
    type: Date
  },
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
inventoryTransactionSchema.index({ inventoryitemid: 1 });
inventoryTransactionSchema.index({ transactiontype: 1 });
inventoryTransactionSchema.index({ transactiondate: -1 });
inventoryTransactionSchema.index({ issuedto: 1 });
inventoryTransactionSchema.index({ issuedby: 1 });
inventoryTransactionSchema.index({ status: 1 });

// Virtual for transaction duration (for issued items)
inventoryTransactionSchema.virtual('transactionDuration').get(function() {
  if (this.transactiontype === 'issue' && this.expectedreturndate) {
    const now = new Date();
    const expected = new Date(this.expectedreturndate);
    return Math.ceil((expected - now) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for days since transaction
inventoryTransactionSchema.virtual('daysSinceTransaction').get(function() {
  const now = new Date();
  const transaction = new Date(this.transactiondate);
  return Math.floor((now - transaction) / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
inventoryTransactionSchema.virtual('isOverdue').get(function() {
  if (this.transactiontype === 'issue' && this.expectedreturndate) {
    const now = new Date();
    const expected = new Date(this.expectedreturndate);
    return now > expected;
  }
  return false;
});

// Static method to find transactions by item
inventoryTransactionSchema.statics.findByItem = function(itemId) {
  return this.find({ inventoryitemid: itemId }).sort({ transactiondate: -1 });
};

// Static method to find transactions by type
inventoryTransactionSchema.statics.findByType = function(type) {
  return this.find({ transactiontype: type }).sort({ transactiondate: -1 });
};

// Static method to find transactions by user
inventoryTransactionSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { issuedto: userId },
      { issuedby: userId }
    ]
  }).sort({ transactiondate: -1 });
};

// Static method to find overdue transactions
inventoryTransactionSchema.statics.findOverdue = function() {
  const now = new Date();
  return this.find({
    transactiontype: 'issue',
    expectedreturndate: { $lt: now },
    status: 'completed'
  }).sort({ expectedreturndate: 1 });
};

// Static method to find pending transactions
inventoryTransactionSchema.statics.findPending = function() {
  return this.find({ status: 'pending' }).sort({ transactiondate: -1 });
};

// Static method to get transaction statistics
inventoryTransactionSchema.statics.getStatistics = function(startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.transactiondate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$transactiontype',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: '$totalcost' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get monthly transaction report
inventoryTransactionSchema.statics.getMonthlyReport = function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return this.aggregate([
    {
      $match: {
        transactiondate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          type: '$transactiontype',
          day: { $dayOfMonth: '$transactiondate' }
        },
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: '$totalcost' }
      }
    },
    {
      $sort: { '_id.day': 1 }
    }
  ]);
};

// Instance method to approve transaction
inventoryTransactionSchema.methods.approve = function(approvedBy) {
  this.status = 'approved';
  this.approvedby = approvedBy;
  this.approvaldate = new Date();
  return this.save();
};

// Instance method to cancel transaction
inventoryTransactionSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Instance method to complete transaction
inventoryTransactionSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

// Instance method to return item
inventoryTransactionSchema.methods.returnItem = function(returnedBy, actualReturnDate, condition, notes) {
  this.actualreturndate = actualReturnDate || new Date();
  this.condition = condition || 'excellent';
  this.notes = notes || this.notes;
  
  // Create a return transaction
  const returnTransaction = new this.constructor({
    inventoryitemid: this.inventoryitemid,
    transactiontype: 'return',
    quantity: this.quantity,
    previousquantity: this.newquantity,
    newquantity: this.newquantity + this.quantity,
    issuedby: returnedBy,
    purpose: 'Item Return',
    notes: `Returned from transaction ${this._id}`,
    requestid: this.requestid,
    condition: condition || 'excellent'
  });
  
  return returnTransaction.save();
};

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

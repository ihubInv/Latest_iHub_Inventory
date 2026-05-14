const mongoose = require('mongoose');

const userSnapshotSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    role: { type: String, trim: true },
    department: { type: String, trim: true },
  },
  { _id: false }
);

const changeEntrySchema = new mongoose.Schema(
  {
    field: { type: String, required: true, trim: true },
    from: { type: mongoose.Schema.Types.Mixed },
    to: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const assetAuditLogSchema = new mongoose.Schema(
  {
    inventoryitemid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
      index: true,
    },
    assetuniqueid: { type: String, trim: true, index: true },
    action: { type: String, required: true, trim: true, index: true },
    actor: { type: userSnapshotSchema, required: true },
    subject: { type: userSnapshotSchema },
    changes: { type: [changeEntrySchema], default: [] },
    remarks: { type: String, trim: true, maxlength: 2000 },
    metadata: { type: mongoose.Schema.Types.Mixed },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

assetAuditLogSchema.index({ inventoryitemid: 1, occurredAt: 1 });

module.exports = mongoose.model('AssetAuditLog', assetAuditLogSchema);

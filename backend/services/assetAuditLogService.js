const AssetAuditLog = require('../models/AssetAuditLog');

function actorFromReqUser(user) {
  if (!user) {
    return { name: 'System', email: null, role: null };
  }
  return {
    userid: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/**
 * Persist a structured audit row for an inventory item.
 */
async function logAssetAudit({
  inventoryItemId,
  assetUniqueId,
  action,
  req,
  subject,
  changes,
  remarks,
  metadata,
}) {
  if (!inventoryItemId) return;
  await AssetAuditLog.create({
    inventoryitemid: inventoryItemId,
    assetuniqueid: assetUniqueId || '',
    action,
    actor: actorFromReqUser(req?.user),
    subject: subject || undefined,
    changes: Array.isArray(changes) ? changes : [],
    remarks: remarks || '',
    metadata: metadata || {},
    occurredAt: new Date(),
  });
}

module.exports = { logAssetAudit };

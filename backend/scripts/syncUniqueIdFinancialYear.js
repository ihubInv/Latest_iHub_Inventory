/**
 * One-off: align each inventory item's Unique ID year segment with its Financial Year.
 * Run: node scripts/syncUniqueIdFinancialYear.js (from backend directory)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');

const buildUniqueIdWithFinancialYear = (uniqueId, financialYear) => {
  if (!uniqueId || !financialYear) {
    return null;
  }

  const parts = uniqueId.toUpperCase().trim().split('/');
  if (parts.length !== 5) {
    return null;
  }

  parts[1] = String(financialYear).toUpperCase().trim();
  return parts.join('/');
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const items = await InventoryItem.find({
    uniqueid: { $exists: true, $ne: '' },
    financialyear: { $exists: true, $ne: '' }
  }).select('_id uniqueid financialyear assetname');

  let updatedCount = 0;
  let skippedCount = 0;
  const conflicts = [];
  const invalidFormat = [];

  for (const item of items) {
    const nextUniqueId = buildUniqueIdWithFinancialYear(item.uniqueid, item.financialyear);
    if (!nextUniqueId) {
      invalidFormat.push({
        id: item._id.toString(),
        uniqueid: item.uniqueid,
        financialyear: item.financialyear
      });
      continue;
    }

    if (nextUniqueId === item.uniqueid.toUpperCase().trim()) {
      skippedCount += 1;
      continue;
    }

    const existingItem = await InventoryItem.findOne({
      uniqueid: nextUniqueId,
      _id: { $ne: item._id }
    }).select('_id uniqueid');

    if (existingItem) {
      conflicts.push({
        id: item._id.toString(),
        currentUniqueId: item.uniqueid,
        financialyear: item.financialyear,
        nextUniqueId,
        conflictWith: existingItem._id.toString()
      });
      continue;
    }

    item.uniqueid = nextUniqueId;
    await item.save();
    updatedCount += 1;
    console.log(`Updated ${item._id}: ${item.uniqueid}`);
  }

  console.log(`Processed ${items.length} item(s).`);
  console.log(`Updated ${updatedCount} item(s).`);
  console.log(`Skipped ${skippedCount} already aligned item(s).`);

  if (invalidFormat.length > 0) {
    console.log(`Skipped ${invalidFormat.length} item(s) with invalid Unique ID format.`);
  }

  if (conflicts.length > 0) {
    console.log(`Skipped ${conflicts.length} item(s) due to Unique ID conflicts.`);
    conflicts.forEach((conflict) => {
      console.log(
        `Conflict for ${conflict.id}: ${conflict.currentUniqueId} -> ${conflict.nextUniqueId} (already used by ${conflict.conflictWith})`
      );
    });
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

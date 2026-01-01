// Asset ID Generator Utility
// Generates unique IDs for assets within categories

/**
 * Generate a unique asset ID
 * Format: CATEGORY_PREFIX + TIMESTAMP + RANDOM_SUFFIX
 * Example: COMP_20241201_ABC123
 */
export const generateAssetId = (categoryName: string, assetName: string): string => {
  // Create category prefix (first 4 characters, uppercase)
  const categoryPrefix = categoryName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
  
  // Create asset prefix (first 3 characters, uppercase)
  const assetPrefix = assetName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  
  // Generate timestamp (YYYYMMDD format)
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  // Generate random suffix (3 characters)
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${categoryPrefix}_${assetPrefix}_${timestamp}_${randomSuffix}`;
};

/**
 * Generate a shorter asset ID for display purposes
 * Format: CATEGORY_ASSET_RANDOM
 * Example: COMP_LAP_ABC123
 */
export const generateShortAssetId = (categoryName: string, assetName: string): string => {
  // Create category prefix (first 3 characters, uppercase)
  const categoryPrefix = categoryName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  
  // Create asset prefix (first 3 characters, uppercase)
  const assetPrefix = assetName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  
  // Generate random suffix (6 characters)
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `${categoryPrefix}_${assetPrefix}_${randomSuffix}`;
};

/**
 * Validate asset ID format
 */
export const validateAssetId = (assetId: string): boolean => {
  // Check if it follows the expected format
  const pattern = /^[A-Z]{3,4}_[A-Z]{3}_[A-Z0-9_]+$/;
  return pattern.test(assetId);
};

/**
 * Extract category and asset name from asset ID
 */
export const parseAssetId = (assetId: string): { categoryPrefix: string; assetPrefix: string } | null => {
  const parts = assetId.split('_');
  if (parts.length >= 2) {
    return {
      categoryPrefix: parts[0],
      assetPrefix: parts[1]
    };
  }
  return null;
};

/**
 * Generate asset ID with collision detection
 * Ensures uniqueness within a category
 */
export const generateUniqueAssetId = (
  categoryName: string, 
  assetName: string, 
  existingAssets: string[] = []
): string => {
  let assetId = generateShortAssetId(categoryName, assetName);
  let counter = 1;
  
  // Check for collisions and add counter if needed
  while (existingAssets.includes(assetId)) {
    assetId = generateShortAssetId(categoryName, assetName) + `_${counter}`;
    counter++;
  }
  
  return assetId;
};

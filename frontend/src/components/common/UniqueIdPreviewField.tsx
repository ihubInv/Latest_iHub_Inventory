import React from 'react';
import { Package } from 'lucide-react';

function assetCodeFromName(assetName: string): string {
  if (!assetName) return '';
  return assetName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
}

export interface UniqueIdPreviewFieldProps {
  financialYear: string;
  assetName: string;
  location: string;
  uniqueId?: string;
  /** Next serial from API (e.g. "593") — used when uniqueId is not built yet */
  serialPreview?: string;
  /** Row index for Add Multiple Items (593, 594, 595, …) */
  rowIndex?: number;
  required?: boolean;
}

function resolveSerialSegment(
  uniqueId: string,
  serialPreview: string,
  rowIndex: number
): string {
  if (uniqueId.trim()) {
    const part = uniqueId.split('/').pop();
    if (part && part !== '--') return part;
  }
  const base = parseInt(serialPreview, 10) || 1;
  return (base + rowIndex).toString().padStart(3, '0');
}

const UniqueIdPreviewField: React.FC<UniqueIdPreviewFieldProps> = ({
  financialYear,
  assetName,
  location,
  uniqueId = '',
  serialPreview = '001',
  rowIndex = 0,
  required = true,
}) => {
  const assetCode = assetCodeFromName(assetName) || '--';
  const serialSegment = resolveSerialSegment(uniqueId, serialPreview, rowIndex);
  const hasFinancialYear = Boolean(financialYear?.trim());
  const hasAsset = Boolean(assetName?.trim());
  const hasLocation = Boolean(location?.trim());
  const serialReady = hasFinancialYear && hasAsset && hasLocation;
  const completedParts =
    [hasFinancialYear, hasAsset, hasLocation].filter(Boolean).length + (serialReady ? 1 : 0);
  const showProgress = Boolean(uniqueId || hasFinancialYear || hasAsset || hasLocation);

  const missingLabels = [
    !hasFinancialYear && 'Financial Year',
    !hasAsset && 'Asset Name',
    !hasLocation && 'Location',
  ].filter(Boolean) as string[];

  const segmentClass = (filled: boolean) =>
    `text-[10px] font-mono px-1 py-0.5 rounded border whitespace-nowrap ${
      filled
        ? 'bg-green-100 border-green-300 text-green-700'
        : 'bg-red-100 border-red-300 text-red-500'
    }`;

  return (
    <div>
      <label className="flex items-center mb-2 text-sm font-medium text-gray-700">
        <span>Unique ID {required ? '*' : ''}</span>
        <span className="px-2 py-1 ml-2 text-xs text-blue-800 bg-blue-100 rounded-full">Auto-Generated</span>
      </label>
      <div className="relative">
        <div className="relative flex items-center w-full h-11 overflow-hidden border border-gray-300 cursor-not-allowed bg-gray-50 rounded-xl">
          <div
            className="flex items-center flex-1 min-w-0 gap-0.5 px-3 overflow-x-auto unique-id-scroll"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            <style>{`.unique-id-scroll::-webkit-scrollbar { display: none; }`}</style>
            <span className="text-[10px] font-medium text-blue-600 whitespace-nowrap">🔄</span>
            <span className="px-1 py-0.5 text-[10px] font-mono font-semibold text-blue-600 bg-white border border-gray-200 rounded whitespace-nowrap">
              ihub
            </span>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">/</span>
            <span className={segmentClass(hasFinancialYear)}>{financialYear || '--'}</span>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">/</span>
            <span className={segmentClass(hasAsset)}>{assetCode}</span>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">/</span>
            <span className={segmentClass(hasLocation)}>{location || '--'}</span>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">/</span>
            <span className={segmentClass(serialReady)}>{serialSegment}</span>
          </div>
          <div className="absolute inset-y-0 right-0 z-10 flex items-center pr-3 pointer-events-none bg-gray-50">
            <Package className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {showProgress && (
          <div className="flex items-center mt-2 space-x-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
              <div
                className="h-1.5 transition-all duration-300 rounded-full bg-gradient-to-r from-[#0d559e] to-[#1a6bb8]"
                style={{ width: `${Math.min(100, (completedParts / 4) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500">{completedParts}/4 Complete</span>
          </div>
        )}

        {missingLabels.length > 0 && (
          <div className="mt-1 text-xs text-amber-600">
            ⚠️ Missing: {missingLabels.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniqueIdPreviewField;

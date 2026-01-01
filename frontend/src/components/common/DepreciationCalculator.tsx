import React, { useState, useEffect } from 'react';
import { Calculator, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { COMPANY_INFO, getValidYear } from '../../constants/companyInfo';

interface DepreciationCalculatorProps {
  assetValue: number;
  salvageValue: number;
  usefulLife: number;
  purchaseDate: Date;
  method: 'written-down-value';
  onCalculate?: (depreciation: any) => void;
}

interface DepreciationResult {
  yearlyDepreciation: number;
  monthlyDepreciation: number;
  currentValue: number;
  depreciationSchedule: Array<{
    year: number;
    beginningValue: number;
    depreciation: number;
    endingValue: number;
    accumulatedDepreciation: number;
  }>;
}

const DepreciationCalculator: React.FC<DepreciationCalculatorProps> = ({
  assetValue,
  salvageValue,
  usefulLife,
  purchaseDate,
  method,
  onCalculate
}) => {
  const [depreciation, setDepreciation] = useState<DepreciationResult | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(COMPANY_INFO?.currentYear);

  // Ensure purchaseDate is a valid Date object
  const safePurchaseDate = React.useMemo(() => {
    if (purchaseDate instanceof Date && !isNaN(purchaseDate.getTime())) {
      return purchaseDate;
    }
    // If purchaseDate is not a valid Date, use current date
    console.warn('DepreciationCalculator: Invalid purchaseDate provided, using current date instead:', purchaseDate);
    return new Date();
  }, [purchaseDate]);

  // Calculate purchase year for use in JSX
  const purchaseYear = React.useMemo(() => {
    return getValidYear(safePurchaseDate.getFullYear());
  }, [safePurchaseDate]);

  // Validate other required props
  const isValidInput = React.useMemo(() => {
    return assetValue > 0 && usefulLife > 0 && salvageValue >= 0 && salvageValue < assetValue;
  }, [assetValue, usefulLife, salvageValue]);

  useEffect(() => {
    if (isValidInput) {
      try {
        const result = calculateDepreciation();
        setDepreciation(result);
        onCalculate?.(result);
      } catch (error) {
        console.error('Error calculating depreciation:', error);
        setDepreciation(null);
      }
    } else {
      setDepreciation(null);
    }
  }, [assetValue, salvageValue, usefulLife, safePurchaseDate, method, isValidInput, purchaseYear, currentYear]);

  const calculateDepreciation = (): DepreciationResult => {
    // Additional safety check
    if (!isValidInput) {
      throw new Error('Invalid input parameters for depreciation calculation');
    }

    const yearsElapsed = currentYear - purchaseYear;
    
    let yearlyDepreciation = 0;
    let currentValue = assetValue;
    const depreciationSchedule = [];

    // Written-Down Value (WDV) Method
    // Formula: R = 1 - (Salvage Value / Original Cost)^(1/Useful Life)
    const depreciationRate = 1 - Math.pow(salvageValue / assetValue, 1 / usefulLife);
    
    for (let year = 1; year <= usefulLife; year++) {
      const beginningValue = year === 1 ? assetValue : currentValue;
      const depreciation = beginningValue * depreciationRate;
      currentValue = beginningValue - depreciation;
      const accumulatedDepreciation = assetValue - currentValue;
      
      depreciationSchedule.push({
        year: purchaseYear + year - 1,
        beginningValue,
        depreciation,
        endingValue: currentValue,
        accumulatedDepreciation
      });
    }
    
    yearlyDepreciation = depreciationSchedule[0]?.depreciation || 0;

    return {
      yearlyDepreciation,
      monthlyDepreciation: yearlyDepreciation / 12,
      currentValue: yearsElapsed > 0 ? depreciationSchedule[Math.min(yearsElapsed, usefulLife - 1)]?.endingValue || salvageValue : assetValue,
      depreciationSchedule
    };
  };

  const getMethodDescription = () => {
    return 'Depreciation based on reducing balance method - higher depreciation in early years';
  };

  if (!depreciation) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calculator className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Depreciation Calculator</h3>
          <p className="text-sm text-gray-600">{getMethodDescription()}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Yearly Depreciation</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            ₹{depreciation.yearlyDepreciation.toFixed(2)}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Monthly Depreciation</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            ₹{depreciation.monthlyDepreciation.toFixed(2)}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Current Value</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            ₹{depreciation.currentValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Depreciation Schedule */}
      <div className="mb-4">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Depreciation Schedule</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Beginning Value</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Depreciation</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ending Value</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Accumulated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {depreciation.depreciationSchedule.map((row, index) => (
                <tr key={`${row.year}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 font-medium text-gray-900">{row.year}</td>
                  <td className="px-3 py-2 text-gray-700">₹{row.beginningValue.toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-700">₹{row.depreciation.toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-700">₹{row.endingValue.toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-700">₹{row.accumulatedDepreciation.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Year Selector */}
      <div className="flex items-center space-x-3">
        <label className="text-sm font-medium text-gray-700">Calculate for year:</label>
        <select
          value={currentYear}
          onChange={(e) => setCurrentYear(getValidYear(Number(e.target.value)))}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Array.from({ length: usefulLife + 1 }, (_, i) => {
            const year = getValidYear(purchaseYear + i);
            return year;
          }).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DepreciationCalculator;

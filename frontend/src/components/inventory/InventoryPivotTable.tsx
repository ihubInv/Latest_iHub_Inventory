import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGetInventoryItemsQuery } from '../../store/api';
import { Download, Filter, RotateCcw, Table, BarChart3, PieChart, TrendingUp, FileSpreadsheet, FileText, Image, Eye, Calendar, Sliders, Bookmark, Thermometer } from 'lucide-react';
import AttractiveDropdown from '../common/AttractiveDropdown';
import DateRangePicker from '../common/DateRangePicker';
import { PivotBarChart, PivotPieChart, PivotLineChart, PivotHeatmap } from '../charts/ChartComponents';
import * as XLSX from 'xlsx';
import { createAttractiveExcelFile, createAttractiveCSV } from '../../utils/enhancedExport';

interface PivotConfig {
  rows: string[];
  columns: string[];
  values: string;
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

interface PivotFilters {
  dateRange: { start: Date | null; end: Date | null };
  valueRange: { min: number | null; max: number | null };
  customFilters: { [key: string]: string[] };
}

interface DrillDownData {
  row: string;
  col: string;
  records: any[];
  totalValue: number;
}

interface PivotTemplate {
  id: string;
  name: string;
  description: string;
  config: PivotConfig;
  icon: string;
}

const InventoryPivotTable: React.FC = () => {
  const { data: inventoryResponse } = useGetInventoryItemsQuery({});
  const inventoryItems = inventoryResponse?.data || [];
  const [pivotConfig, setPivotConfig] = useState<PivotConfig>({
    rows: ['assetcategory'],
    columns: ['status'],
    values: 'balancequantityinstock',
    aggregation: 'sum'
  });
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line' | 'heatmap'>('bar');
  const [showCharts, setShowCharts] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [filters, setFilters] = useState<PivotFilters>({
    dateRange: { start: null, end: null },
    valueRange: { min: null, max: null },
    customFilters: {}
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Chart references for export
  const primaryChartRef = useRef<any>(null);
  const secondaryChartRef = useRef<any>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // Close filters dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  // Close templates dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templatesRef.current && !templatesRef.current.contains(event.target as Node)) {
        setShowTemplates(false);
      }
    };

    if (showTemplates) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTemplates]);

  // Chart image capture function
  const captureChartImage = async (chartRef: React.RefObject<any>): Promise<string | null> => {
    if (!chartRef.current) return null;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: 400,
        width: 600
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing chart:', error);
      return null;
    }
  };

  // Pivot Templates
  const pivotTemplates: PivotTemplate[] = [
    {
      id: 'stock-analysis',
      name: 'Stock Analysis',
      description: 'Analyze stock levels by category and status',
      icon: '📊',
      config: {
        rows: ['assetcategory'],
        columns: ['status'],
        values: 'balancequantityinstock',
        aggregation: 'sum'
      }
    },
    {
      id: 'cost-analysis',
      name: 'Cost Analysis',
      description: 'Analyze costs by vendor and condition',
      icon: '💰',
      config: {
        rows: ['vendorname'],
        columns: ['conditionofasset'],
        values: 'totalcost',
        aggregation: 'sum'
      }
    },
    {
      id: 'inventory-health',
      name: 'Inventory Health',
      description: 'Monitor stock levels vs minimum requirements',
      icon: '🏥',
      config: {
        rows: ['assetcategory'],
        columns: ['status'],
        values: 'balancequantityinstock',
        aggregation: 'sum'
      }
    },
    {
      id: 'vendor-performance',
      name: 'Vendor Performance',
      description: 'Compare vendors by location and cost',
      icon: '🏢',
      config: {
        rows: ['vendorname'],
        columns: ['locationofitem'],
        values: 'totalcost',
        aggregation: 'avg'
      }
    },
    {
      id: 'condition-overview',
      name: 'Asset Condition',
      description: 'Overview of asset conditions by category',
      icon: '🔍',
      config: {
        rows: ['assetcategory'],
        columns: ['conditionofasset'],
        values: 'balancequantityinstock',
        aggregation: 'count'
      }
    }
  ];

  const availableFields = [
    { value: 'assetcategory', label: 'Asset Category', icon: <Table className="w-4 h-4 text-blue-500" />, description: 'Group by asset category' },
    { value: 'status', label: 'Status', icon: <BarChart3 className="w-4 h-4 text-green-500" />, description: 'Group by item status' },
    { value: 'conditionofasset', label: 'Condition', icon: <Thermometer className="w-4 h-4 text-orange-500" />, description: 'Group by asset condition' },
    { value: 'locationofitem', label: 'Location', icon: <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, description: 'Group by location' },
    { value: 'vendorname', label: 'Vendor', icon: <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>, description: 'Group by vendor' },
    { value: 'unitofmeasurement', label: 'Unit', icon: <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, description: 'Group by unit of measurement' },
    { value: 'financialyear', label: 'Financial Year', icon: <Calendar className="w-4 h-4 text-teal-500" />, description: 'Group by financial year' }
  ];

  const valueFields = [
    { value: 'balancequantityinstock', label: 'Quantity in Stock', icon: <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, description: 'Current stock quantity' },
    { value: 'rateinclusivetax', label: 'Rate (Inclusive Tax)', icon: <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>, description: 'Price including tax' },
    { value: 'totalcost', label: 'Total Cost', icon: <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, description: 'Total item cost' },
    { value: 'minimumstocklevel', label: 'Minimum Stock Level', icon: <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>, description: 'Minimum required stock' }
  ];

  const aggregationOptions = [
    { value: 'count', label: 'Count', icon: <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, description: 'Count of items' },
    { value: 'sum', label: 'Sum', icon: <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>, description: 'Sum of values' },
    { value: 'avg', label: 'Average', icon: <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, description: 'Average of values' },
    { value: 'min', label: 'Minimum', icon: <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>, description: 'Minimum value' },
    { value: 'max', label: 'Maximum', icon: <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, description: 'Maximum value' }
  ];

  // Filter inventory items based on current filters
  const filteredInventoryItems = useMemo(() => {
    return inventoryItems?.filter((item: any) => {
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const itemDate = new Date(item.created_at || item.updated_at);
        if (filters.dateRange.start && itemDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && itemDate > filters.dateRange.end) return false;
      }

      // Value range filter
      if (filters.valueRange.min !== null || filters.valueRange.max !== null) {
        const value = item[pivotConfig.values[0] as keyof typeof item] as number;
        if (filters.valueRange.min !== null && value < filters.valueRange.min) return false;
        if (filters.valueRange.max !== null && value > filters.valueRange.max) return false;
      }

      // Custom filters
      for (const [field, allowedValues] of Object.entries(filters.customFilters)) {
        if (allowedValues.length > 0) {
          const itemValue = item[field as keyof typeof item];
          if (!allowedValues.includes(itemValue)) return false;
        }
      }

      return true;
    });
  }, [inventoryItems, filters, pivotConfig.values]);

  const pivotData = useMemo(() => {
    if (!filteredInventoryItems.length) return { rows: [], columns: [], data: {}, drillDownData: {} };

    // Get unique values for rows and columns
    const rowValues = [...new Set(filteredInventoryItems.map((item: any) => 
      pivotConfig.rows.map(field => item[field as keyof typeof item] || 'N/A').join(' | ')
    ))].sort();

    const columnValues = [...new Set(filteredInventoryItems.map((item: any) => 
      pivotConfig.columns.map(field => item[field as keyof typeof item] || 'N/A').join(' | ')
    ))].sort();

    // Create data matrix with drill-down data
    const data: { [key: string]: { [key: string]: number } } = {};
    const drillDownData: { [key: string]: { [key: string]: any[] } } = {};
    
    rowValues.forEach(rowValue => {
      data[rowValue] = {};
      drillDownData[rowValue] = {};
      columnValues.forEach(columnValue => {
        const filteredItems = filteredInventoryItems?.filter((item: any) => {
          const itemRowValue = pivotConfig.rows.map(field => item[field as keyof typeof item] || 'N/A').join(' | ');
          const itemColumnValue = pivotConfig.columns.map(field => item[field as keyof typeof item] || 'N/A').join(' | ');
          return itemRowValue === rowValue && itemColumnValue === columnValue;
        });

        // Store drill-down data
        drillDownData[rowValue][columnValue] = filteredItems;

        let value = 0;
        if (filteredItems.length > 0) {
          const values = filteredItems.map((item: any) => {
            const fieldValue = item[pivotConfig.values as keyof typeof item];
            return typeof fieldValue === 'number' ? fieldValue : 0;
          });

          switch (pivotConfig.aggregation) {
            case 'count':
              value = filteredItems.length;
              break;
            case 'sum':
              value = values.reduce((sum, val) => sum + val, 0);
              break;
            case 'avg':
              value = values.reduce((sum, val) => sum + val, 0) / values.length;
              break;
            case 'min':
              value = Math.min(...values);
              break;
            case 'max':
              value = Math.max(...values);
              break;
          }
        }

        data[rowValue][columnValue] = value;
      });
    });

    return { rows: rowValues, columns: columnValues, data, drillDownData };
  }, [filteredInventoryItems, pivotConfig]);

  // Enhanced export functions
  // const createEnhancedWorkbook = (includeCharts: boolean = false) => {
  //   const wb = XLSX.utils.book_new();
    
  //   // Create main data worksheet with enhanced formatting
  //   const wsData: any[][] = [];
    
  //   // Add title and metadata
  //   wsData.push(['INVENTORY PIVOT ANALYSIS REPORT']);
  //   wsData.push(['Generated on:', new Date().toLocaleString()]);
  //   wsData.push(['']);
    
  //   // Add configuration details
  //   wsData.push(['CONFIGURATION DETAILS']);
  //   wsData.push(['Row Field:', availableFields.find(f => f.value === pivotConfig.rows[0])?.label || pivotConfig.rows[0]]);
  //   wsData.push(['Column Field:', availableFields.find(f => f.value === pivotConfig.columns[0])?.label || pivotConfig.columns[0]]);
  //   wsData.push(['Value Field:', valueFields.find(f => f.value === pivotConfig.values[0])?.label || pivotConfig.values[0]]);
  //   wsData.push(['Aggregation:', pivotConfig.aggregation.toUpperCase()]);
  //   wsData.push(['']);
    
  //   // Add summary statistics
  //   wsData.push(['SUMMARY STATISTICS']);
  //   const totalRows = pivotData.rows.length;
  //   const totalCols = pivotData.columns.length;
  //   const totalCells = totalRows * totalCols;
  //   const grandTotal = pivotData.rows.reduce((sum, row) => 
  //     sum + pivotData.columns.reduce((rowSum, col) => rowSum + (pivotData.data[row][col] || 0), 0), 0
  //   );
    
  //   wsData.push(['Total Categories:', totalRows]);
  //   wsData.push(['Total Data Points:', totalCols]);
  //   wsData.push(['Total Data Cells:', totalCells]);
  //   wsData.push(['Grand Total:', pivotConfig.aggregation === 'avg' ? (grandTotal / totalCells).toFixed(2) : grandTotal.toLocaleString()]);
  //   wsData.push(['']);
    
  //   // Add pivot table data with enhanced formatting
  //   wsData.push(['PIVOT TABLE DATA']);
  //   wsData.push(['']);
    
  //   // Header row
  //   const headerRow = ['Category', ...pivotData.columns, 'Row Total'];
  //   wsData.push(headerRow);
    
  //   // Data rows
  //   pivotData.rows.forEach(row => {
  //     const rowData = [row];
  //     let rowTotal = 0;
      
  //     pivotData.columns.forEach(col => {
  //       const value = pivotData.data[row][col] || 0;
  //       rowTotal += value;
  //       rowData.push(pivotConfig.aggregation === 'avg' ? value.toFixed(2) : value);
  //     });
      
  //     rowData.push(pivotConfig.aggregation === 'avg' ? (rowTotal / pivotData.columns.length).toFixed(2) : rowTotal);
  //     wsData.push(rowData);
  //   });
    
  //   // Column totals
  //   const totalRow = ['Column Total'];
  //   pivotData.columns.forEach(col => {
  //     const colTotal = pivotData.rows.reduce((sum, row) => sum + (pivotData.data[row][col] || 0), 0);
  //     totalRow.push(pivotConfig.aggregation === 'avg' ? (colTotal / pivotData.rows.length).toFixed(2) : colTotal);
  //   });
  //   totalRow.push(pivotConfig.aggregation === 'avg' ? (grandTotal / totalCells).toFixed(2) : grandTotal);
  //   wsData.push(totalRow);
    
  //   // Add detailed breakdown
  //   wsData.push(['']);
  //   wsData.push(['DETAILED BREAKDOWN']);
  //   wsData.push(['']);
    
  //   // Create detailed data for each category
  //   pivotData.rows.forEach(row => {
  //     wsData.push([`${row} Details:`]);
  //     pivotData.columns.forEach(col => {
  //       const value = pivotData.data[row][col] || 0;
  //       const percentage = grandTotal > 0 ? ((value / grandTotal) * 100).toFixed(1) : '0.0';
  //       wsData.push([`  ${col}:`, value, `(${percentage}%)`]);
  //     });
  //     wsData.push(['']);
  //   });
    
  //   const ws = XLSX.utils.aoa_to_sheet(wsData);
    
  //   // Apply cell styling and formatting
  //   const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
  //   // Set column widths
  //   ws['!cols'] = [
  //     { wch: 25 }, // Category column
  //     ...pivotData.columns.map(() => ({ wch: 15 })), // Data columns
  //     { wch: 15 } // Total column
  //   ];
    
  //   XLSX.utils.book_append_sheet(wb, ws, 'Pivot Analysis');
    
  //   // If including charts, create a summary sheet
  //   if (includeCharts) {
  //     const chartSummary: any[][] = [];
  //     chartSummary.push(['CHART DATA SUMMARY']);
  //     chartSummary.push(['']);
  //     chartSummary.push(['Chart Configuration:']);
  //     chartSummary.push(['Primary Chart Type:', chartType.toUpperCase()]);
  //     chartSummary.push(['Data Visualization:', 'Chart data included for external tools']);
  //     chartSummary.push(['']);
      
  //     // Add chart data in structured format for external visualization
  //     chartSummary.push(['CHART DATA (for external charting tools)']);
  //     chartSummary.push(['']);
  //     chartSummary.push(['Category', ...pivotData.columns, 'Total']);
      
  //     pivotData.rows.forEach(row => {
  //       const rowData = [row];
  //       let rowTotal = 0;
  //       pivotData.columns.forEach(col => {
  //         const value = pivotData.data[row][col] || 0;
  //         rowTotal += value;
  //         rowData.push(value);
  //       });
  //       rowData.push(rowTotal);
  //       chartSummary.push(rowData);
  //     });
      
  //     // Add percentage breakdown
  //     chartSummary.push(['']);
  //     chartSummary.push(['PERCENTAGE BREAKDOWN']);
  //     chartSummary.push(['Category', ...pivotData.columns.map(col => `${col} %`), 'Total %']);
      
  //     const totalGrand = pivotData.rows.reduce((sum, row) => 
  //       sum + pivotData.columns.reduce((rowSum, col) => rowSum + (pivotData.data[row][col] || 0), 0), 0
  //     );
      
  //     pivotData.rows.forEach(row => {
  //       const rowData = [row];
  //       let rowTotal = 0;
  //       pivotData.columns.forEach(col => {
  //         const value = pivotData.data[row][col] || 0;
  //         rowTotal += value;
  //         const percentage = totalGrand > 0 ? ((value / totalGrand) * 100).toFixed(1) : '0.0';
  //         rowData.push(`${percentage}%`);
  //       });
  //       const totalPercentage = totalGrand > 0 ? ((rowTotal / totalGrand) * 100).toFixed(1) : '0.0';
  //       rowData.push(`${totalPercentage}%`);
  //       chartSummary.push(rowData);
  //     });
      
  //     const wsChart = XLSX.utils.aoa_to_sheet(chartSummary);
  //     wsChart['!cols'] = [{ wch: 20 }, ...pivotData.columns.map(() => ({ wch: 15 })), { wch: 15 }];
      
  //     XLSX.utils.book_append_sheet(wb, wsChart, 'Chart Data');
  //   }
    
  //   return wb;
  // };

  const exportToExcelEnhanced = async (includeCharts: boolean = false) => {
    setIsExporting(true);
    try {
      const workbook = await createAttractiveExcelFile(
        pivotData,
        pivotConfig,
        availableFields,
        valueFields,
        chartType,
        includeCharts,
        showCharts,
        primaryChartRef,
        secondaryChartRef
      );
      
      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `pivot-analysis-${includeCharts ? 'with-charts' : 'table-only'}-${timestamp}.xlsx`;
      link.download = filename;
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Export successful: ${filename}`);
    } catch (error) {
      console.error('❌ Export failed:', error);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const exportToCsvEnhanced = (includeCharts: boolean = false) => {
    setIsExporting(true);
    try {
      const csvContent = createAttractiveCSV(
        pivotData,
        pivotConfig,
        availableFields,
        valueFields,
        chartType,
        includeCharts
      );
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `pivot-analysis-${includeCharts ? 'with-charts' : 'table-only'}-${timestamp}.csv`;
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Export successful: ${filename}`);
    } catch (error) {
      console.error('❌ Export failed:', error);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Legacy function for backward compatibility
  // const exportToExcel = () => {
  //   exportToExcelEnhanced(false);
  // };

  // const exportToCSV = () => {
  //   const csvContent = [
  //     ['', ...pivotData.columns].join(','),
  //     ...pivotData.rows.map(row => [
  //       row,
  //       ...pivotData.columns.map(col => pivotData.data[row][col] || 0)
  //     ].join(','))
  //   ].join('\n');

  //   const blob = new Blob([csvContent], { type: 'text/csv' });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `inventory-pivot-${new Date().toISOString().split('T')[0]}.csv`;
  //   a.click();
  //   window.URL.revokeObjectURL(url);
  // };

  const exportSelectedData = () => {
    const selectedRows = pivotData.rows.filter(row => 
      pivotData.columns.some(col => selectedCells.has(`${row}-${col}`))
    );
    const selectedColumns = pivotData.columns.filter(col => 
      pivotData.rows.some(row => selectedCells.has(`${row}-${col}`))
    );

    const worksheetData = [
      ['', ...selectedColumns],
      ...selectedRows.map(row => [
        row,
        ...selectedColumns.map(col => 
          selectedCells.has(`${row}-${col}`) ? (pivotData.data[row][col] || 0) : ''
        )
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Data');
    XLSX.writeFile(workbook, `inventory-selected-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const toggleCellSelection = (row: string, col: string) => {
    const cellKey = `${row}-${col}`;
    const newSelection = new Set(selectedCells);
    if (newSelection.has(cellKey)) {
      newSelection.delete(cellKey);
    } else {
      newSelection.add(cellKey);
    }
    setSelectedCells(newSelection);
  };

  // Drill-down functionality
  const handleCellClick = (row: string, col: string) => {
    const records = pivotData.drillDownData?.[row]?.[col] || [];
    const totalValue = pivotData.data[row]?.[col] || 0;
    
    setDrillDownData({
      row,
      col,
      records,
      totalValue
    });
    setShowDrillDown(true);
  };

  // Template management
  const applyTemplate = (template: PivotTemplate) => {
    setPivotConfig(template.config);
    setSelectedCells(new Set());
    setShowTemplates(false);
  };

  // Filter management
  const updateCustomFilter = (field: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      customFilters: {
        ...prev.customFilters,
        [field]: values
      }
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: { start: null, end: null },
      valueRange: { min: null, max: null },
      customFilters: {}
    });
  };

  const resetPivot = () => {
    setPivotConfig({
      rows: ['assetcategory'],
      columns: ['status'],
      values: 'balancequantityinstock',
      aggregation: 'sum'
    });
    setSelectedCells(new Set());
    clearFilters();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Inventory Pivot Table</h2>
            <p className="text-gray-600">Analyze inventory data with custom dimensions</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Templates Button */}
          <div className="relative" ref={templatesRef}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center px-3 py-2 space-x-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Bookmark size={16} />
              <span>Templates</span>
            </button>
            
            {showTemplates && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10 rounded-t-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] rounded-lg">
                      <Bookmark className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Pivot Templates</h3>
                      <p className="text-xs text-gray-600">Quick setup for common analyses</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {pivotTemplates.map((template, index) => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template)}
                      className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] group bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-indigo-50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-200">
                          <span className="text-2xl">{template.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-900 transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-xs text-gray-600 group-hover:text-blue-700 transition-colors mt-1">
                            {template.description}
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-hover:bg-blue-200 transition-colors">
                              {template.config.rows[0].replace('asset', '').replace('of', '').replace('item', '')}
                            </span>
                            <span className="text-gray-400">×</span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 group-hover:bg-green-200 transition-colors">
                              {template.config.columns[0].replace('of', '').replace('asset', '')}
                            </span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                  <p className="text-xs text-gray-500 text-center">
                    💡 Templates automatically configure rows, columns, and values for optimal analysis
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Filters Button */}
          <div className="relative" ref={filtersRef}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 space-x-2 rounded-lg transition-colors ${
                Object.keys(filters.customFilters).length > 0 || 
                filters.dateRange.start || 
                filters.dateRange.end || 
                filters.valueRange.min !== null || 
                filters.valueRange.max !== null
                  ? 'text-blue-700 bg-blue-100 border border-blue-200'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Sliders size={16} />
              <span>Filters</span>
              {(Object.keys(filters.customFilters).length > 0 || 
                filters.dateRange.start || 
                filters.dateRange.end || 
                filters.valueRange.min !== null || 
                filters.valueRange.max !== null) && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] rounded-lg">
                        <Sliders className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Advanced Filters</h3>
                        <p className="text-xs text-gray-600">Refine your data analysis</p>
                      </div>
                    </div>
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-6">
                  {/* Date Range Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <label className="text-sm font-semibold text-gray-800">Date Range</label>
                    </div>
                    <DateRangePicker
                      startDate={filters.dateRange.start}
                      endDate={filters.dateRange.end}
                      onStartDateChange={(date) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: date }
                      }))}
                      onEndDateChange={(date) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: date }
                      }))}
                      startPlaceholder="Start date"
                      endPlaceholder="End date"
                      className="w-full"
                    />
                  </div>

                  {/* Value Range Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                      <label className="text-sm font-semibold text-gray-800">Value Range</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Minimum</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={filters.valueRange.min || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            valueRange: { ...prev.valueRange, min: e.target.value ? parseFloat(e.target.value) : null }
                          }))}
                          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Maximum</label>
                        <input
                          type="number"
                          placeholder="∞"
                          value={filters.valueRange.max || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            valueRange: { ...prev.valueRange, max: e.target.value ? parseFloat(e.target.value) : null }
                          }))}
                          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom Filters */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-purple-600" />
                      <label className="text-sm font-semibold text-gray-800">Field Filters</label>
                    </div>
                    <div className="space-y-4">
                      {availableFields.slice(0, 3).map((field, index) => {
                        const uniqueValues = [...new Set(inventoryItems.map((item: any) => item[field.value as keyof typeof item]))];
                        const selectedCount = (filters.customFilters[field.value] || []).length;
                        const fieldOptions = uniqueValues.map(value => ({
                          value: value,
                          label: value,
                          icon: <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        }));
                        
                        return (
                          <div key={field.value} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-gray-700">{field.label}</label>
                              {selectedCount > 0 && (
                                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                  {selectedCount} selected
                                </span>
                              )}
                            </div>
                            <AttractiveDropdown
                              options={fieldOptions}
                              value={filters.customFilters[field.value]?.[0] || ''}
                              onChange={(value) => {
                                const currentValues = filters.customFilters[field.value] || [];
                                if (currentValues.includes(value)) {
                                  // Remove if already selected
                                  updateCustomFilter(field.value, currentValues.filter(v => v !== value));
                                } else {
                                  // Add to selection
                                  updateCustomFilter(field.value, [...currentValues, value]);
                                }
                              }}
                              placeholder={`Select ${field.label.toLowerCase()}`}
                              size="sm"
                              searchable
                              icon={<Filter className="w-4 h-4 text-purple-500" />}
                            />
                            {selectedCount > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(filters.customFilters[field.value] || []).map((selectedValue, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full"
                                  >
                                    {selectedValue}
                                    <button
                                      onClick={() => {
                                        const newValues = (filters.customFilters[field.value] || []).filter(v => v !== selectedValue);
                                        updateCustomFilter(field.value, newValues);
                                      }}
                                      className="ml-1 text-purple-600 hover:text-purple-800"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-gray-100 bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10 rounded-b-2xl">
                  <p className="text-xs text-gray-500 text-center">
                    🎯 Use filters to focus on specific data ranges and categories
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={resetPivot}
            className="flex items-center px-3 py-2 space-x-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
          
          {/* Enhanced Export Menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className={`flex items-center px-4 py-2 space-x-2 text-white rounded-lg transition-colors ${
                isExporting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              }`}
            >
              <Download size={16} className="text-blue-500" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              <svg className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Export Options</h3>
                  <p className="text-xs text-gray-600 mt-1">Choose format and content</p>
                </div>
                
                <div className="p-3 space-y-3">
                  {/* Excel Export Options */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700 flex items-center">
                      <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                      Excel (.xlsx)
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => exportToExcelEnhanced(false)}
                        disabled={isExporting}
                        className="flex items-center justify-between px-3 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span>📊 Table Only</span>
                        <span className="text-gray-500">Enhanced</span>
                      </button>
                      <button
                        onClick={() => exportToExcelEnhanced(true)}
                        disabled={isExporting}
                        className="flex items-center justify-between px-3 py-2 text-xs text-gray-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <span>📈 With Chart Data</span>
                        <span className="text-blue-600">Premium</span>
                      </button>
                    </div>
                  </div>

                  {/* CSV Export Options */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-orange-600" />
                      CSV (.csv)
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => exportToCsvEnhanced(false)}
                        disabled={isExporting}
                        className="flex items-center justify-between px-3 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span>📋 Table Only</span>
                        <span className="text-gray-500">Basic</span>
                      </button>
                      <button
                        onClick={() => exportToCsvEnhanced(true)}
                        disabled={isExporting}
                        className="flex items-center justify-between px-3 py-2 text-xs text-gray-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <span>📊 With Chart Data</span>
                        <span className="text-orange-600">Extended</span>
                      </button>
                    </div>
                  </div>

                  {/* Export Info */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Data rows: {pivotData.rows.length}</span>
                      <span>Columns: {pivotData.columns.length}</span>
                    </div>
                    {showCharts && (
                      <div className="text-xs text-blue-600 mt-1">
                        Chart type: {chartType.toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {selectedCells.size > 0 && (
            <button
              onClick={exportSelectedData}
              className="flex items-center px-3 py-2 space-x-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download size={16} className="text-blue-500" />
              <span>Selected ({selectedCells.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          <AttractiveDropdown
            label="Row Fields"
            options={availableFields}
            value={pivotConfig.rows[0]}
            onChange={(value) => setPivotConfig(prev => ({ ...prev, rows: [value] }))}
            placeholder="Select row field"
            size="sm"
            searchable
            icon={<Table className="w-4 h-4 text-blue-500" />}
          />
          
          <AttractiveDropdown
            label="Column Fields"
            options={availableFields}
            value={pivotConfig.columns[0]}
            onChange={(value) => setPivotConfig(prev => ({ ...prev, columns: [value] }))}
            placeholder="Select column field"
            size="sm"
            searchable
            icon={<BarChart3 className="w-4 h-4 text-green-500" />}
          />
          
          <AttractiveDropdown
            label="Value Fields"
            options={valueFields}
            value={pivotConfig.values[0]}
            onChange={(value) => setPivotConfig(prev => ({ ...prev, values: [value] }))}
            placeholder="Select value field"
            size="sm"
            searchable
            icon={<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
          />
          
          <AttractiveDropdown
            label="Aggregation"
            options={aggregationOptions}
            value={pivotConfig.aggregation}
            onChange={(value) => setPivotConfig(prev => ({ ...prev, aggregation: value as any }))}
            placeholder="Select aggregation"
            size="sm"
            searchable
            icon={<svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          />
        </div>
      </div>

      {/* Charts Section */}
      {pivotData.rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">Data Visualization</h3>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Chart Type:</span>
                  <div className="flex rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                        chartType === 'bar' 
                          ? 'bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Bar</span>
                    </button>
                    <button
                      onClick={() => setChartType('pie')}
                      className={`px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center space-x-2 border-l border-gray-200 ${
                        chartType === 'pie' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700'
                      }`}
                    >
                      <PieChart className="w-4 h-4" />
                      <span>Pie</span>
                    </button>
                    <button
                      onClick={() => setChartType('line')}
                      className={`px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center space-x-2 border-l border-gray-200 ${
                        chartType === 'line' 
                          ? 'bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Line</span>
                    </button>
                    <button
                      onClick={() => setChartType('heatmap')}
                      className={`px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center space-x-2 border-l border-gray-200 ${
                        chartType === 'heatmap' 
                          ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' 
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-700'
                      }`}
                    >
                      <Thermometer className="w-4 h-4" />
                      <span>Heat</span>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowCharts(!showCharts)}
                  className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>{showCharts ? 'Hide Charts' : 'Show Charts'}</span>
                </button>
              </div>
            </div>
          </div>
          
          {showCharts && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Primary Chart */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="h-80" ref={primaryChartRef}>
                    {chartType === 'bar' && <PivotBarChart pivotData={pivotData} config={pivotConfig} />}
                    {chartType === 'pie' && <PivotPieChart pivotData={pivotData} config={pivotConfig} />}
                    {chartType === 'line' && <PivotLineChart pivotData={pivotData} config={pivotConfig} />}
                    {chartType === 'heatmap' && <PivotHeatmap pivotData={pivotData} config={pivotConfig} />}
                  </div>
                  <div className="mt-3 text-center">
                    <h4 className="text-sm font-medium text-gray-900">
                      {chartType === 'bar' && 'Bar Chart Analysis'}
                      {chartType === 'pie' && 'Distribution Overview'}
                      {chartType === 'line' && 'Trend Analysis'}
                      {chartType === 'heatmap' && 'Heatmap Analysis'}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {pivotConfig.aggregation.charAt(0).toUpperCase() + pivotConfig.aggregation.slice(1)} of {
                        valueFields.find(f => f.value === pivotConfig.values[0])?.label
                      }
                    </p>
                  </div>
                </div>

                {/* Secondary Chart (Alternative view) */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="h-80" ref={secondaryChartRef}>
                    {chartType !== 'pie' ? (
                      <PivotPieChart pivotData={pivotData} config={pivotConfig} />
                    ) : (
                      <PivotBarChart pivotData={pivotData} config={pivotConfig} />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <h4 className="text-sm font-medium text-gray-900">
                      {chartType !== 'pie' ? 'Distribution Overview' : 'Bar Chart Analysis'}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">Alternative visualization</p>
                  </div>
                </div>
              </div>

              {/* Chart Insights */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Chart Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="text-blue-800">
                    <span className="font-medium">Total Categories:</span> {pivotData.rows.length}
                  </div>
                  <div className="text-blue-800">
                    <span className="font-medium">Data Points:</span> {pivotData.columns.length}
                  </div>
                  <div className="text-blue-800">
                    <span className="font-medium">Aggregation:</span> {pivotConfig.aggregation.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pivot Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Table className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">
              {pivotConfig.aggregation.charAt(0).toUpperCase() + pivotConfig.aggregation.slice(1)} of {
                valueFields.find(f => f.value === pivotConfig.values[0])?.label
              } by {
                availableFields.find(f => f.value === pivotConfig.rows[0])?.label
              } and {
                availableFields.find(f => f.value === pivotConfig.columns[0])?.label
              }
            </h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  {availableFields.find(f => f.value === pivotConfig.rows[0])?.label}
                </th>
                {pivotData.columns.map(col => (
                  <th key={col} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    {col}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pivotData.rows.map(row => {
                const rowTotal = pivotData.columns.reduce((sum, col) => sum + (pivotData.data[row][col] || 0), 0);
                return (
                  <tr key={row} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                      {row}
                    </td>
                    {pivotData.columns.map(col => {
                      const value = pivotData.data[row][col] || 0;
                      const cellKey = `${row}-${col}`;
                      const isSelected = selectedCells.has(cellKey);
                      return (
                        <td 
                          key={col} 
                          className={`px-6 py-4 whitespace-nowrap text-sm text-center border-r border-gray-200 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-100 text-blue-900' : 'text-gray-900 hover:bg-blue-50'
                          }`}
                          onClick={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                              toggleCellSelection(row, col);
                            } else {
                              handleCellClick(row, col);
                            }
                          }}
                          title="Click to drill down, Ctrl+Click to select"
                        >
                          {pivotConfig.aggregation === 'avg' ? value.toFixed(2) : value.toLocaleString()}
                        </td>
                      );
                    })}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center bg-blue-50 text-blue-900">
                      {pivotConfig.aggregation === 'avg' ? (rowTotal / pivotData.columns.length).toFixed(2) : rowTotal.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r border-gray-200">
                  Total
                </td>
                {pivotData.columns.map(col => {
                  const colTotal = pivotData.rows.reduce((sum, row) => sum + (pivotData.data[row][col] || 0), 0);
                  return (
                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center text-blue-900 border-r border-gray-200">
                      {pivotConfig.aggregation === 'avg' ? (colTotal / pivotData.rows.length).toFixed(2) : colTotal.toLocaleString()}
                    </td>
                  );
                })}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center text-blue-900">
                  {pivotData.rows.reduce((sum, row) => 
                    sum + pivotData.columns.reduce((rowSum, col) => rowSum + (pivotData.data[row][col] || 0), 0), 0
                  ).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {selectedCells.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <span className="text-blue-900 font-medium">
                {selectedCells.size} cells selected
              </span>
            </div>
            <button
              onClick={() => setSelectedCells(new Set())}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Drill-Down Modal */}
      {showDrillDown && drillDownData && (
        <div className="fixed inset-0 backdrop-blur-sm transition-all duration-300 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] rounded-xl">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Drill-Down Analysis</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium text-blue-600">{drillDownData.row}</span> × <span className="font-medium text-indigo-600">{drillDownData.col}</span> • <span className="font-medium text-purple-600">{drillDownData.records.length} records</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDrillDown(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Total Value</p>
                      <p className="text-lg font-bold text-blue-900">
                        {pivotConfig.aggregation === 'avg' 
                          ? drillDownData.totalValue.toFixed(2) 
                          : drillDownData.totalValue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700">Record Count</p>
                      <p className="text-lg font-bold text-green-900">{drillDownData.records.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">Aggregation</p>
                      <p className="text-lg font-bold text-purple-900">{pivotConfig.aggregation.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {drillDownData.records.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Detailed Records</h4>
                    <p className="text-sm text-gray-600 mt-1">Individual items that make up this data point</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Item Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Total Cost
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Location
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {drillDownData.records.map((record, index) => (
                          <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900 group-hover:text-blue-900">
                              {record.itemname || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {record.assetcategory || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                record.status === 'Available' ? 'bg-green-100 text-green-800 border border-green-200' :
                                record.status === 'In Use' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                record.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                {record.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {record.balancequantityinstock || 0}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-100 text-green-800 text-xs font-medium">
                                ${record.totalcost ? record.totalcost.toLocaleString() : '0'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {record.locationofitem || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Records Found</h3>
                  <p className="text-gray-600">No inventory items match the selected criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPivotTable;

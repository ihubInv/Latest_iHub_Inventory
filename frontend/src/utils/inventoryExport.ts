import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type { InventoryItem } from '../types';

/**
 * Complete inventory export utility
 * Downloads ALL inventory data from database, not just visible items
 */

export interface ExportOptions {
  includeAllFields?: boolean;
  selectedFields?: string[];
  format?: 'excel' | 'csv';
  filename?: string;
  includeCharts?: boolean;
  includeSummary?: boolean;
  styling?: 'basic' | 'professional' | 'premium';
}

export interface InventoryExportData {
  id: string;
  uniqueid: string;
  financialyear: string;
  dateofinvoice: string;
  dateofentry: string;
  invoicenumber: string;
  assetcategory: string;
  assetcategoryid: string;
  assetname: string;
  specification: string;
  makemodel: string;
  productserialnumber: string;
  vendorname: string;
  quantityperitem: number;
  rateinclusivetax: number;
  totalcost: number;
  locationofitem: string;
  issuedto: string;
  dateofissue: string;
  expectedreturndate: string;
  balancequantityinstock: number;
  description: string;
  unitofmeasurement: string;
  depreciationmethod: string;
  warrantyinformation: string;
  maintenanceschedule: string;
  conditionofasset: string;
  status: string;
  minimumstocklevel: number;
  purchaseordernumber: string;
   expectedlifespan: string;
  annualmanagementcharge: number;
  createdat: string;
  lastmodifieddate: string;
  lastmodifiedby: string;
  createdby: string;
}

// Field mapping for user-friendly column names
export const FIELD_MAPPING: Record<string, string> = {
  id: 'ID',
  uniqueid: 'Unique ID',
  financialyear: 'Financial Year',
  dateofinvoice: 'Date of Invoice',
  dateofentry: 'Date of Entry',
  invoicenumber: 'Invoice Number',
  assetcategory: 'Asset Category',
  assetcategoryid: 'Asset Category ID',
  assetname: 'Asset Name',
  specification: 'Specification',
  makemodel: 'Make/Model',
  productserialnumber: 'Serial Number',
  vendorname: 'Vendor Name',
  quantityperitem: 'Quantity Per Item',
  rateinclusivetax: 'Rate (Inclusive Tax)',
  totalcost: 'Total Cost',
  locationofitem: 'Location',
  issuedto: 'Issued To',
  dateofissue: 'Date of Issue',
  expectedreturndate: 'Expected Return Date',
  balancequantityinstock: 'Quantity In Stock',
  description: 'Description',
  unitofmeasurement: 'Unit of Measurement',
  depreciationmethod: 'Depreciation Method',
  warrantyinformation: 'Warranty Information',
  maintenanceschedule: 'Maintenance Schedule',
  conditionofasset: 'Condition',
  status: 'Status',
  minimumstocklevel: 'Minimum Stock Level',
  purchaseordernumber: 'Purchase Order Number',
  expectedlifespan: 'Expected Lifespan',
  annualmanagementcharge: 'Annual Management Charge (AMS)',
  createdat: 'Created At',
  lastmodifieddate: 'Last Modified',
  lastmodifiedby: 'Modified By',
  createdby: 'Created By'
};

// Default fields to include in export
export const DEFAULT_EXPORT_FIELDS = [
  'uniqueid',
  'assetname',
  'assetcategory',
  'specification',
  'makemodel',
  'productserialnumber',
  'vendorname',
  'quantityperitem',
  'rateinclusivetax',
  'totalcost',
  'locationofitem',
  'status',
  'conditionofasset',
  'balancequantityinstock',
  'unitofmeasurement',
  'dateofinvoice',
  'dateofentry',
  'createdat'
];

/**
 * Process inventory data for export
 */
export function processInventoryDataForExport(data: InventoryItem[]): InventoryExportData[] {
  try {
    console.log('🔄 Processing inventory data for export...');
    console.log(`✅ Processing ${data?.length || 0} inventory items`);
    
    // Transform data for export
    const exportData: InventoryExportData[] = (data || []).map(item => ({
      id: item.id || '',
      uniqueid: item.uniqueid || '',
      financialyear: item.financialyear || '',
      dateofinvoice: item.dateofinvoice ? new Date(item.dateofinvoice).toLocaleDateString() : '',
      dateofentry: item.dateofentry ? new Date(item.dateofentry).toLocaleDateString() : '',
      invoicenumber: item.invoicenumber || '',
      assetcategory: item.assetcategory || '',
      assetcategoryid: item.assetcategoryid || '',
      assetname: item.assetname || '',
      specification: item.specification || '',
      makemodel: item.makemodel || '',
      productserialnumber: item.productserialnumber || '',
      vendorname: item.vendorname || '',
      quantityperitem: item.quantityperitem || 0,
      rateinclusivetax: item.rateinclusivetax || 0,
      totalcost: item.totalcost || 0,
      locationofitem: item.locationofitem || '',
      issuedto: item.issuedto || '',
      dateofissue: item.dateofissue ? new Date(item.dateofissue).toLocaleDateString() : '',
      expectedreturndate: item.expectedreturndate ? new Date(item.expectedreturndate).toLocaleDateString() : '',
      balancequantityinstock: item.balancequantityinstock || 0,
      description: item.description || '',
      unitofmeasurement: item.unitofmeasurement || '',
      depreciationmethod: item.depreciationmethod || '',
      warrantyinformation: item.warrantyinformation || '',
      maintenanceschedule: item.maintenanceschedule || '',
      conditionofasset: item.conditionofasset || '',
      status: item.status || '',
      minimumstocklevel: item.minimumstocklevel || 0,
      purchaseordernumber: item.purchaseordernumber || '',
       expectedlifespan: item.expectedlifespan || '',
      annualmanagementcharge: item.annualmanagementcharge || 0,
      createdat: item.createdat ? new Date(item.createdat).toLocaleString() : '',
      lastmodifieddate: item.lastmodifieddate ? new Date(item.lastmodifieddate).toLocaleString() : '',
      lastmodifiedby: item.lastmodifiedby || '',
      createdby: item.createdby || ''
    }));

    return exportData;
  } catch (error) {
    console.error('❌ Error processing inventory data:', error);
    throw error;
  }
}

/**
 * Export inventory data to Excel with enhanced styling and charts
 */
export async function exportInventoryToExcel(inventoryData: InventoryItem[], options: ExportOptions = {}): Promise<void> {
  try {
    console.log('🔄 Starting enhanced Excel export...');
    
    const {
      includeAllFields = false,
      selectedFields = DEFAULT_EXPORT_FIELDS,
      filename = `complete-inventory-${new Date().toISOString().split('T')[0]}.xlsx`,
      includeCharts = true,
      includeSummary = true,
      styling = 'professional'
    } = options;

    // Process all data
    const allData = processInventoryDataForExport(inventoryData);
    
    if (allData.length === 0) {
      throw new Error('No inventory data found to export');
    }

    // Determine fields to export
    const fieldsToExport = includeAllFields 
      ? Object.keys(FIELD_MAPPING)
      : selectedFields;

    // Create workbook with ExcelJS for enhanced styling
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Inventory Management System';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.title = 'Complete Inventory Export';
    workbook.properties.description = 'Comprehensive inventory data export with charts and analysis';

    // Create main data sheet
    const dataSheet = workbook.addWorksheet('Inventory Data', {
      properties: { tabColor: { argb: 'FF4F46E5' } }
    });

    // Add headers with styling
    const headers = fieldsToExport.map(field => FIELD_MAPPING[field] || field);
    dataSheet.addRow(headers);

    // Style header row
    const headerRow = dataSheet.getRow(1);
    headerRow.font = { 
      bold: true, 
      color: { argb: 'FFFFFFFF' },
      size: 12,
      name: 'Calibri'
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E7D32' }
    };
    headerRow.alignment = { 
      horizontal: 'center', 
      vertical: 'middle',
      wrapText: true
    };
    headerRow.height = 25;

    // Add data rows with alternating colors
    allData.forEach((item, index) => {
      const row = dataSheet.addRow(
        fieldsToExport.map(field => {
          const value = item[field as keyof InventoryExportData];
          return value !== null && value !== undefined ? value : '';
        })
      );

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }
        };
      }

      // Style numeric columns
      fieldsToExport.forEach((field, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        if (['quantityperitem', 'rateinclusivetax', 'totalcost', 'balancequantityinstock', 'minimumstocklevel', 'salvagevalue'].includes(field)) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
      });
    });

    // Set column widths and auto-fit
    fieldsToExport.forEach((field, index) => {
      const column = dataSheet.getColumn(index + 1);
      const headerLength = headers[index].length;
      column.width = Math.max(headerLength + 5, 15);
      column.alignment = { vertical: 'middle' };
    });

    // Add borders to all cells
    dataSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
      });
    });

    // Add summary sheet if requested
    if (includeSummary) {
      const summarySheet = workbook.addWorksheet('Export Summary', {
        properties: { tabColor: { argb: 'FF1976D2' } }
      });

      // Summary content with styling
      const summaryData = [
        ['📊 INVENTORY EXPORT SUMMARY', ''],
        ['', ''],
        ['📅 Export Date:', new Date().toLocaleString()],
        ['📦 Total Items:', allData.length],
        ['📋 Fields Exported:', fieldsToExport.length],
        ['💾 File Size:', 'Calculated on save'],
        ['', ''],
        ['📈 DATA BREAKDOWN', ''],
        ['', ''],
        ['🏷️ Categories:', new Set(allData.map(item => item.assetcategory)).size],
        ['📍 Locations:', new Set(allData.map(item => item.locationofitem)).size],
        ['🏢 Vendors:', new Set(allData.map(item => item.vendorname)).size],
        ['📊 Status Types:', new Set(allData.map(item => item.status)).size],
        ['', ''],
        ['📋 EXPORTED FIELDS', ''],
        ['', ''],
        ...fieldsToExport.map(field => [FIELD_MAPPING[field] || field, '✅'])
      ];

      summaryData.forEach((row, index) => {
        const excelRow = summarySheet.addRow(row);
        
        if (index === 0) {
          // Title row
          excelRow.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
          excelRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1976D2' }
          };
          excelRow.height = 30;
        } else if (index === 8 || index === 15) {
          // Section headers
          excelRow.font = { bold: true, size: 12, color: { argb: 'FF1976D2' } };
          excelRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE3F2FD' }
          };
        }
      });

      summarySheet.getColumn(1).width = 25;
      summarySheet.getColumn(2).width = 20;
    }

    // Add charts sheet if requested
    if (includeCharts) {
      try {
        const chartsSheet = workbook.addWorksheet('Charts & Analysis', {
          properties: { tabColor: { argb: 'FFE91E63' } }
        });

        // Add chart titles
        chartsSheet.addRow(['📊 INVENTORY ANALYSIS CHARTS']);
        chartsSheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
        chartsSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE91E63' }
        };
        chartsSheet.getRow(1).height = 30;

        // Prepare data for charts
        const categoryData = allData.reduce((acc, item) => {
          const category = item.assetcategory || 'Unknown';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const statusData = allData.reduce((acc, item) => {
          const status = item.status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Add data to sheet for charts
        let currentRow = 3;
        
        // Category data
        chartsSheet.addRow(['Category', 'Count']);
        currentRow++;
        Object.entries(categoryData).forEach(([category, count]) => {
          chartsSheet.addRow([category, count]);
          currentRow++;
        });

        // Add some space
        currentRow += 2;
        chartsSheet.addRow(['Status', 'Count']);
        currentRow++;
        Object.entries(statusData).forEach(([status, count]) => {
          chartsSheet.addRow([status, count]);
          currentRow++;
        });

        // Create charts using the correct ExcelJS API
        if (Object.keys(categoryData).length > 0) {
          try {
            // Create a simple pie chart
            const categoryChart = chartsSheet.addChart({
              type: 'pie',
              name: 'Category Distribution'
            });

            // Use direct data instead of cell references
            const categoryEntries = Object.entries(categoryData);
            categoryChart.addSeries({
              name: 'Categories',
              categories: categoryEntries.map(([category]) => category),
              values: categoryEntries.map(([, count]) => count),
              dataLabels: {
                showValue: true,
                showPercent: true
              }
            });

            categoryChart.setPosition('D3', 'K20');
            console.log('✅ Category chart created successfully');
          } catch (chartError) {
            console.warn('⚠️ Category chart creation failed:', chartError);
            // Add a note about chart failure
            chartsSheet.addRow(['', '']);
            chartsSheet.addRow(['⚠️ Chart creation failed - showing data only']);
            chartsSheet.getRow(chartsSheet.rowCount).font = { italic: true, color: { argb: 'FFFF6B6B' } };
          }
        }

        if (Object.keys(statusData).length > 0) {
          try {
            // Create a simple column chart
            const statusChart = chartsSheet.addChart({
              type: 'column',
              name: 'Status Distribution'
            });

            // Use direct data instead of cell references
            const statusEntries = Object.entries(statusData);
            statusChart.addSeries({
              name: 'Status',
              categories: statusEntries.map(([status]) => status),
              values: statusEntries.map(([, count]) => count),
              dataLabels: {
                showValue: true
              }
            });

            statusChart.setPosition('D25', 'K42');
            console.log('✅ Status chart created successfully');
          } catch (chartError) {
            console.warn('⚠️ Status chart creation failed:', chartError);
            // Add a note about chart failure
            const failureRow = chartsSheet.rowCount + 1;
            chartsSheet.addRow(['', '']);
            chartsSheet.addRow(['⚠️ Status chart creation failed - showing data only']);
            chartsSheet.getRow(failureRow).font = { italic: true, color: { argb: 'FFFF6B6B' } };
          }
        }

        // Financial summary
        const totalValue = allData.reduce((sum, item) => sum + (item.totalcost || 0), 0);
        const avgValue = allData.length > 0 ? totalValue / allData.length : 0;

        const summaryRow = currentRow + 2;
        chartsSheet.addRow(['', '']);
        chartsSheet.addRow(['💰 FINANCIAL SUMMARY', '']);
        chartsSheet.addRow(['Total Inventory Value:', `₹${totalValue.toLocaleString('en-IN')}`]);
        chartsSheet.addRow(['Average Item Value:', `₹${avgValue.toLocaleString('en-IN')}`]);
        chartsSheet.addRow(['Total Items:', allData.length]);

        // Style financial summary
        for (let i = summaryRow; i <= summaryRow + 4; i++) {
          const row = chartsSheet.getRow(i);
          if (i === summaryRow) {
            row.font = { bold: true, size: 12, color: { argb: 'FFE91E63' } };
            row.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFCE4EC' }
            };
          } else {
            row.font = { size: 11 };
          }
        }

        chartsSheet.getColumn(1).width = 25;
        chartsSheet.getColumn(2).width = 20;

        console.log('✅ Charts sheet created successfully');
      } catch (chartsError) {
        console.warn('⚠️ Charts sheet creation failed, creating data-only charts sheet:', chartsError);
        
        // Create a fallback charts sheet with just data visualization
        try {
          const fallbackChartsSheet = workbook.addWorksheet('Data Analysis', {
            properties: { tabColor: { argb: 'FF6B7280' } }
          });

          // Add title
          fallbackChartsSheet.addRow(['📊 INVENTORY DATA ANALYSIS']);
          fallbackChartsSheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
          fallbackChartsSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6B7280' }
          };
          fallbackChartsSheet.getRow(1).height = 30;

          // Category analysis
          const categoryData = allData.reduce((acc, item) => {
            const category = item.assetcategory || 'Unknown';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          fallbackChartsSheet.addRow(['', '']);
          fallbackChartsSheet.addRow(['📈 CATEGORY DISTRIBUTION', '']);
          fallbackChartsSheet.addRow(['Category', 'Count', 'Percentage']);
          
          const totalItems = allData.length;
          Object.entries(categoryData).forEach(([category, count]) => {
            const percentage = ((count / totalItems) * 100).toFixed(1);
            fallbackChartsSheet.addRow([category, count, `${percentage}%`]);
          });

          // Status analysis
          const statusData = allData.reduce((acc, item) => {
            const status = item.status || 'Unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          fallbackChartsSheet.addRow(['', '']);
          fallbackChartsSheet.addRow(['📊 STATUS DISTRIBUTION', '']);
          fallbackChartsSheet.addRow(['Status', 'Count', 'Percentage']);
          
          Object.entries(statusData).forEach(([status, count]) => {
            const percentage = ((count / totalItems) * 100).toFixed(1);
            fallbackChartsSheet.addRow([status, count, `${percentage}%`]);
          });

          // Financial summary
          const totalValue = allData.reduce((sum, item) => sum + (item.totalcost || 0), 0);
          const avgValue = allData.length > 0 ? totalValue / allData.length : 0;

          fallbackChartsSheet.addRow(['', '']);
          fallbackChartsSheet.addRow(['💰 FINANCIAL SUMMARY', '']);
          fallbackChartsSheet.addRow(['Total Inventory Value:', `₹${totalValue.toLocaleString('en-IN')}`]);
          fallbackChartsSheet.addRow(['Average Item Value:', `₹${avgValue.toLocaleString('en-IN')}`]);
          fallbackChartsSheet.addRow(['Total Items:', allData.length]);

          // Style the fallback sheet
          fallbackChartsSheet.getColumn(1).width = 25;
          fallbackChartsSheet.getColumn(2).width = 15;
          fallbackChartsSheet.getColumn(3).width = 15;

          console.log('✅ Fallback data analysis sheet created successfully');
        } catch (fallbackError) {
          console.warn('⚠️ Fallback sheet creation also failed:', fallbackError);
        }
      }
    }

    // Write and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Enhanced Excel export completed: ${filename}`);
    console.log(`📊 Exported ${allData.length} items with ${fieldsToExport.length} fields`);
    console.log(`📈 Charts: ${includeCharts ? 'Included' : 'Not included'}`);
    console.log(`📋 Summary: ${includeSummary ? 'Included' : 'Not included'}`);
    
  } catch (error) {
    console.error('❌ Enhanced Excel export failed:', error);
    throw error;
  }
}

/**
 * Export inventory data to CSV
 */
export async function exportInventoryToCSV(inventoryData: InventoryItem[], options: ExportOptions = {}): Promise<void> {
  try {
    console.log('🔄 Starting CSV export...');

    const {
      includeAllFields = false,
      selectedFields = DEFAULT_EXPORT_FIELDS,
      filename = `complete-inventory-${new Date().toISOString().split('T')[0]}.csv`
    } = options;

    // Process all data
    const allData = processInventoryDataForExport(inventoryData);
    
    if (allData.length === 0) {
      throw new Error('No inventory data found to export');
    }

    // Determine fields to export
    const fieldsToExport = includeAllFields 
      ? Object.keys(FIELD_MAPPING)
      : selectedFields;

    // Create headers
    const headers = fieldsToExport.map(field => FIELD_MAPPING[field] || field);
    
    // Create CSV content
    const csvRows = [
      headers.join(','),
      ...allData.map(item => 
        fieldsToExport.map(field => {
          const value = item[field as keyof InventoryExportData];
          // Escape CSV values
          const stringValue = String(value !== null && value !== undefined ? value : '');
          return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ CSV export completed: ${filename}`);
    console.log(`📊 Exported ${allData.length} items with ${fieldsToExport.length} fields`);
    
  } catch (error) {
    console.error('❌ CSV export failed:', error);
    throw error;
  }
}

/**
 * Get available fields for export
 */
export function getAvailableFields(): Array<{ key: string; label: string }> {
  return Object.entries(FIELD_MAPPING).map(([key, label]) => ({
    key,
    label
  }));
}

/**
 * Export with data only (no charts)
 */
export async function exportDataOnly(): Promise<void> {
  try {
    await exportInventoryToExcel({
      includeAllFields: true,
      includeCharts: false,
      includeSummary: true,
      filename: `inventory-data-only-${new Date().toISOString().split('T')[0]}.xlsx`
    });
  } catch (error) {
    console.error('Data-only export failed:', error);
    throw error;
  }
}

/**
 * Debug function to test chart creation
 */
export async function debugChartExport(): Promise<void> {
  try {
    console.log('🔍 Starting debug chart export...');
    
    // Test with minimal data
    const testData = [
      { assetcategory: 'Laptop', status: 'Active', totalcost: 50000 },
      { assetcategory: 'Desktop', status: 'Inactive', totalcost: 30000 },
      { assetcategory: 'Laptop', status: 'Active', totalcost: 45000 }
    ];

    const workbook = new ExcelJS.Workbook();
    const testSheet = workbook.addWorksheet('Test Charts');
    
    // Add test data
    testSheet.addRow(['Category', 'Count']);
    testSheet.addRow(['Laptop', 2]);
    testSheet.addRow(['Desktop', 1]);

    // Try to create a simple chart using the correct ExcelJS API
    const chart = testSheet.addChart({
      type: 'pie',
      name: 'Test Chart'
    });

    chart.addSeries({
      name: 'Test Data',
      categories: ['Laptop', 'Desktop'],
      values: [2, 1]
    });

    chart.setPosition('D3', 'K20');

    // Write test file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `debug-chart-test-${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ Debug chart export successful');
  } catch (error) {
    console.error('❌ Debug chart export failed:', error);
    throw error;
  }
}

/**
 * Export with charts and analysis
 */
export async function exportWithCharts(): Promise<void> {
  try {
    console.log('🔄 Starting chart export...');
    await exportInventoryToExcel({
      includeAllFields: true,
      includeCharts: true,
      includeSummary: true,
      filename: `inventory-with-charts-${new Date().toISOString().split('T')[0]}.xlsx`
    });
    console.log('✅ Chart export completed successfully');
  } catch (error) {
    console.error('❌ Charts export failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    // Fallback to data-only export if charts fail
    try {
      console.log('🔄 Attempting fallback to data-only export...');
      await exportInventoryToExcel({
        includeAllFields: true,
        includeCharts: false,
        includeSummary: true,
        filename: `inventory-data-fallback-${new Date().toISOString().split('T')[0]}.xlsx`
      });
      console.log('✅ Fallback data-only export successful');
    } catch (fallbackError) {
      console.error('❌ Both chart and fallback exports failed:', fallbackError);
      throw new Error('Export failed. Please try the "Data Only" option instead.');
    }
  }
}
/**
 * Export premium version with all features
 */
export async function exportPremium(): Promise<void> {
  try {
    await exportInventoryToExcel({
      includeAllFields: true,
      includeCharts: true,
      includeSummary: true,
      styling: 'premium',
      filename: `inventory-premium-${new Date().toISOString().split('T')[0]}.xlsx`
    });
  } catch (error) {
    console.error('Premium export failed:', error);
    throw error;
  }
}

/**
 * Quick export with default settings
 */
export async function quickExportCompleteInventory(): Promise<void> {
  try {
    await exportInventoryToExcel({
      includeAllFields: true,
      includeCharts: true,
      includeSummary: true,
      filename: `complete-inventory-${new Date().toISOString().split('T')[0]}.xlsx`
    });
  } catch (error) {
    console.error('Quick export failed:', error);
    throw error;
  }
}


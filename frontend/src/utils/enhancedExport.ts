import ExcelJS from 'exceljs';
import html2canvas from 'html2canvas';

// Chart image capture function
export const captureChartImage = async (chartRef: React.RefObject<any>): Promise<string | null> => {
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

// Enhanced Excel export with charts and styling
export const createAttractiveExcelFile = async (
  pivotData: any,
  pivotConfig: any,
  availableFields: any[],
  valueFields: any[],
  chartType: string,
  includeCharts: boolean = false,
  showCharts: boolean = false,
  primaryChartRef?: React.RefObject<any>,
  secondaryChartRef?: React.RefObject<any>,
  inventoryData?: any[] // Add inventory data parameter
) => {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'Inventory Management System';
  workbook.lastModifiedBy = 'Inventory Management System';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Add complete inventory data sheet if provided
  if (inventoryData && inventoryData.length > 0) {
    const inventorySheet = workbook.addWorksheet('Complete Inventory Data', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'landscape',
        margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
      }
    });

    // Add title
    const titleCell = inventorySheet.getCell('A1');
    titleCell.value = '📊 COMPLETE INVENTORY DATA';
    titleCell.font = { 
      name: 'Segoe UI', 
      size: 18, 
      bold: true, 
      color: { argb: 'FF2563EB' } 
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    inventorySheet.mergeCells('A1:Z1');
    
    // Add background color to title
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    titleCell.border = {
      top: { style: 'thick', color: { argb: 'FF2563EB' } },
      bottom: { style: 'thick', color: { argb: 'FF2563EB' } },
      left: { style: 'thick', color: { argb: 'FF2563EB' } },
      right: { style: 'thick', color: { argb: 'FF2563EB' } }
    };

    // Add metadata
    inventorySheet.getCell('A3').value = 'Generated on:';
    inventorySheet.getCell('B3').value = new Date().toLocaleString();
    inventorySheet.getCell('A4').value = 'Total Items:';
    inventorySheet.getCell('B4').value = inventoryData.length;

    // Get all unique field names from inventory data
    const allFields = new Set<string>();
    inventoryData.forEach(item => {
      Object.keys(item).forEach(key => allFields.add(key));
    });
    
    const fieldNames = Array.from(allFields);
    const headers = fieldNames.map(field => {
      // Convert field names to readable format
      return field.replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    });

    // Add headers
    const headerRow = inventorySheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Segoe UI' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976D2' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.border = {
      top: { style: 'medium', color: { argb: 'FF1565C0' } },
      left: { style: 'medium', color: { argb: 'FF1565C0' } },
      bottom: { style: 'medium', color: { argb: 'FF1565C0' } },
      right: { style: 'medium', color: { argb: 'FF1565C0' } }
    };

    // Add data rows with alternating colors
    inventoryData.forEach((item, index) => {
      const rowData = fieldNames.map(field => {
        const value = item[field];
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        return value || '';
      });
      
      const row = inventorySheet.addRow(rowData);
      
      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }
        };
      }
      
      // Style numeric columns
      fieldNames.forEach((field, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        if (['quantityperitem', 'rateinclusivetax', 'totalcost', 'balancequantityinstock', 'minimumstocklevel', 'salvagevalue'].includes(field)) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
      });
    });

    // Set column widths
    fieldNames.forEach((field, index) => {
      const column = inventorySheet.getColumn(index + 1);
      const headerLength = headers[index].length;
      column.width = Math.max(headerLength + 5, 15);
      column.alignment = { vertical: 'middle' };
    });

    // Add borders to all cells
    inventorySheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
      });
    });
  }
  
  // Main worksheet (Pivot Analysis)
  const worksheet = workbook.addWorksheet('Pivot Analysis', {
    pageSetup: { 
      paperSize: 9, 
      orientation: 'landscape',
      margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
    }
  });

  let currentRow = 1;

  // Title with company branding
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = '📊 INVENTORY PIVOT ANALYSIS REPORT';
  titleCell.font = { 
    name: 'Segoe UI', 
    size: 18, 
    bold: true, 
    color: { argb: 'FF2563EB' } 
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + pivotData.columns.length + 1)}${currentRow}`);
  
  // Add background color to title
  const titleRange = worksheet.getCell(`A${currentRow}`);
  titleRange.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' }
  };
  titleRange.border = {
    top: { style: 'thick', color: { argb: 'FF2563EB' } },
    bottom: { style: 'thick', color: { argb: 'FF2563EB' } },
    left: { style: 'thick', color: { argb: 'FF2563EB' } },
    right: { style: 'thick', color: { argb: 'FF2563EB' } }
  };
  
  currentRow += 2;

  // Metadata section with styling
  worksheet.getCell(`A${currentRow}`).value = 'Generated on:';
  worksheet.getCell(`B${currentRow}`).value = new Date().toLocaleString();
  currentRow++;
  
  worksheet.getCell(`A${currentRow}`).value = 'Report Type:';
  worksheet.getCell(`B${currentRow}`).value = includeCharts ? 'Complete Analysis with Charts' : 'Data Analysis';
  currentRow += 2;

  // Configuration section with attractive styling
  const configCell = worksheet.getCell(`A${currentRow}`);
  configCell.value = '⚙️ CONFIGURATION DETAILS';
  configCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF7C3AED' } };
  configCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEDE9FE' }
  };
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  currentRow++;

  const configs = [
    ['Row Field:', availableFields.find(f => f.value === pivotConfig.rows[0])?.label || pivotConfig.rows[0]],
    ['Column Field:', availableFields.find(f => f.value === pivotConfig.columns[0])?.label || pivotConfig.columns[0]],
    ['Value Field:', valueFields.find(f => f.value === pivotConfig.values[0])?.label || pivotConfig.values[0]],
    ['Aggregation:', pivotConfig.aggregation.toUpperCase()]
  ];

  configs.forEach(([label, value]) => {
    worksheet.getCell(`A${currentRow}`).value = label;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FF4B5563' } };
    worksheet.getCell(`B${currentRow}`).value = value;
    worksheet.getCell(`B${currentRow}`).font = { color: { argb: 'FF1F2937' } };
    currentRow++;
  });

  currentRow++;

  // Summary statistics with colorful styling
  const statsCell = worksheet.getCell(`A${currentRow}`);
  statsCell.value = '📈 SUMMARY STATISTICS';
  statsCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF059669' } };
  statsCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECFDF5' }
  };
  worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
  currentRow++;

  const grandTotal = pivotData.rows.reduce((sum: number, row: string) => 
    sum + pivotData.columns.reduce((rowSum: number, col: string) => rowSum + (pivotData.data[row][col] || 0), 0), 0
  );

  const stats = [
    ['Total Categories:', pivotData.rows.length],
    ['Total Data Points:', pivotData.columns.length],
    ['Grand Total:', pivotConfig.aggregation === 'avg' ? (grandTotal / (pivotData.rows.length * pivotData.columns.length)).toFixed(2) : grandTotal.toLocaleString()]
  ];

  stats.forEach(([label, value]) => {
    worksheet.getCell(`A${currentRow}`).value = label;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FF4B5563' } };
    worksheet.getCell(`B${currentRow}`).value = value;
    worksheet.getCell(`B${currentRow}`).font = { bold: true, color: { argb: 'FF059669' } };
    currentRow++;
  });

  currentRow += 2;

  // Chart section (if including charts)
  if (includeCharts && showCharts && primaryChartRef && secondaryChartRef) {
    try {
      const primaryChartImage = await captureChartImage(primaryChartRef);
      const secondaryChartImage = await captureChartImage(secondaryChartRef);

      if (primaryChartImage || secondaryChartImage) {
        const chartHeaderCell = worksheet.getCell(`A${currentRow}`);
        chartHeaderCell.value = '📊 DATA VISUALIZATION';
        chartHeaderCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFDC2626' } };
        chartHeaderCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEF2F2' }
        };
        worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + pivotData.columns.length + 1)}${currentRow}`);
        currentRow += 2;

        if (primaryChartImage) {
          const primaryImageId = workbook.addImage({
            base64: primaryChartImage.split(',')[1],
            extension: 'png',
          });

          worksheet.addImage(primaryImageId, {
            tl: { col: 0, row: currentRow - 1 },
            br: { col: 6, row: currentRow + 19 }
          } as any);

          worksheet.getCell(`A${currentRow + 21}`).value = `Primary Chart: ${chartType.toUpperCase()}`;
          worksheet.getCell(`A${currentRow + 21}`).font = { bold: true, color: { argb: 'FF4B5563' } };
        }

        if (secondaryChartImage) {
          const secondaryImageId = workbook.addImage({
            base64: secondaryChartImage.split(',')[1],
            extension: 'png',
          });

          worksheet.addImage(secondaryImageId, {
            tl: { col: 7, row: currentRow - 1 },
            br: { col: 13, row: currentRow + 19 }
          } as any);

          worksheet.getCell(`H${currentRow + 21}`).value = `Alternative View: ${chartType !== 'pie' ? 'PIE' : 'BAR'}`;
          worksheet.getCell(`H${currentRow + 21}`).font = { bold: true, color: { argb: 'FF4B5563' } };
        }

        currentRow += 25;
      }
    } catch (error) {
      console.error('Error adding charts to Excel:', error);
    }
  }

  // Pivot table data with attractive styling
  const tableHeaderCell = worksheet.getCell(`A${currentRow}`);
  tableHeaderCell.value = '📋 PIVOT TABLE DATA';
  tableHeaderCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF1D4ED8' } };
  tableHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDBEAFE' }
  };
  worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + pivotData.columns.length + 1)}${currentRow}`);
  currentRow += 2;

  // Table headers with gradient-like styling
  const headerRow = worksheet.getRow(currentRow);
  headerRow.getCell(1).value = 'Category';
  pivotData.columns.forEach((col: string, index: number) => {
    headerRow.getCell(index + 2).value = col;
  });
  headerRow.getCell(pivotData.columns.length + 2).value = 'Row Total';

  // Style headers
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };
  });

  headerRow.height = 25;
  currentRow++;

  // Data rows with alternating colors
  pivotData.rows.forEach((row: string, rowIndex: number) => {
    const dataRow = worksheet.getRow(currentRow);
    dataRow.getCell(1).value = row;
    
    let rowTotal = 0;
    pivotData.columns.forEach((col: string, colIndex: number) => {
      const value = pivotData.data[row][col] || 0;
      rowTotal += value;
      const cellValue = pivotConfig.aggregation === 'avg' ? Number(value.toFixed(2)) : value;
      dataRow.getCell(colIndex + 2).value = cellValue;
    });
    
    const totalValue = pivotConfig.aggregation === 'avg' ? Number((rowTotal / pivotData.columns.length).toFixed(2)) : rowTotal;
    dataRow.getCell(pivotData.columns.length + 2).value = totalValue;

    // Alternating row colors
    const bgColor = rowIndex % 2 === 0 ? 'FFF9FAFB' : 'FFFFFFFF';
    
    dataRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
      
      if (colNumber === 1) {
        cell.font = { bold: true, color: { argb: 'FF374151' } };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else {
        cell.font = { color: { argb: 'FF1F2937' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });

    dataRow.height = 20;
    currentRow++;
  });

  // Totals row with special styling
  const totalRow = worksheet.getRow(currentRow);
  totalRow.getCell(1).value = 'Column Total';
  
  pivotData.columns.forEach((col: string, colIndex: number) => {
    const colTotal = pivotData.rows.reduce((sum: number, row: string) => sum + (pivotData.data[row][col] || 0), 0);
    const totalValue = pivotConfig.aggregation === 'avg' ? Number((colTotal / pivotData.rows.length).toFixed(2)) : colTotal;
    totalRow.getCell(colIndex + 2).value = totalValue;
  });
  
  const finalTotal = pivotConfig.aggregation === 'avg' ? Number((grandTotal / (pivotData.rows.length * pivotData.columns.length)).toFixed(2)) : grandTotal;
  totalRow.getCell(pivotData.columns.length + 2).value = finalTotal;

  // Style totals row
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1D4ED8' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thick', color: { argb: 'FF1D4ED8' } },
      bottom: { style: 'thick', color: { argb: 'FF1D4ED8' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };
  });

  totalRow.height = 25;

  // Auto-fit columns
  worksheet.columns.forEach((column, index) => {
    if (index === 0) {
      column.width = 25; // Category column
    } else {
      column.width = 15; // Data columns
    }
  });

  return workbook;
};

// Enhanced CSV export with better formatting
export const createAttractiveCSV = (
  pivotData: any,
  pivotConfig: any,
  availableFields: any[],
  valueFields: any[],
  chartType: string,
  includeCharts: boolean = false
): string => {
  let csvContent = '';
  
  // Header with styling characters
  csvContent += '📊 INVENTORY PIVOT ANALYSIS REPORT\n';
  csvContent += `Generated on,${new Date().toLocaleString()}\n`;
  csvContent += '\n';
  
  // Configuration section
  csvContent += '⚙️ CONFIGURATION DETAILS\n';
  csvContent += `Row Field,${availableFields.find(f => f.value === pivotConfig.rows[0])?.label || pivotConfig.rows[0]}\n`;
  csvContent += `Column Field,${availableFields.find(f => f.value === pivotConfig.columns[0])?.label || pivotConfig.columns[0]}\n`;
  csvContent += `Value Field,${valueFields.find(f => f.value === pivotConfig.values[0])?.label || pivotConfig.values[0]}\n`;
  csvContent += `Aggregation,${pivotConfig.aggregation.toUpperCase()}\n`;
  csvContent += '\n';
  
  // Summary statistics
  const grandTotal = pivotData.rows.reduce((sum: number, row: string) => 
    sum + pivotData.columns.reduce((rowSum: number, col: string) => rowSum + (pivotData.data[row][col] || 0), 0), 0
  );
  
  csvContent += '📈 SUMMARY STATISTICS\n';
  csvContent += `Total Categories,${pivotData.rows.length}\n`;
  csvContent += `Total Data Points,${pivotData.columns.length}\n`;
  csvContent += `Grand Total,${pivotConfig.aggregation === 'avg' ? (grandTotal / (pivotData.rows.length * pivotData.columns.length)).toFixed(2) : grandTotal.toLocaleString()}\n`;
  csvContent += '\n';
  
  // Pivot table data
  csvContent += '📋 PIVOT TABLE DATA\n';
  csvContent += `Category,${pivotData.columns.join(',')},Row Total\n`;
  
  pivotData.rows.forEach((row: string) => {
    const rowData = [row];
    let rowTotal = 0;
    
    pivotData.columns.forEach((col: string) => {
      const value = pivotData.data[row][col] || 0;
      rowTotal += value;
      rowData.push(pivotConfig.aggregation === 'avg' ? value.toFixed(2) : value.toString());
    });
    
    rowData.push(pivotConfig.aggregation === 'avg' ? (rowTotal / pivotData.columns.length).toFixed(2) : rowTotal.toString());
    csvContent += rowData.join(',') + '\n';
  });
  
  // Column totals
  const totalRow = ['📊 Column Total'];
  pivotData.columns.forEach((col: string) => {
    const colTotal = pivotData.rows.reduce((sum: number, row: string) => sum + (pivotData.data[row][col] || 0), 0);
    totalRow.push((pivotConfig.aggregation === 'avg' ? (colTotal / pivotData.rows.length).toFixed(2) : colTotal).toString());
  });
  totalRow.push((pivotConfig.aggregation === 'avg' ? (grandTotal / (pivotData.rows.length * pivotData.columns.length)).toFixed(2) : grandTotal).toString());
  csvContent += totalRow.join(',') + '\n';
  
  if (includeCharts) {
    csvContent += '\n';
    csvContent += '📊 CHART DATA\n';
    csvContent += `Chart Type,${chartType.toUpperCase()}\n`;
    csvContent += `Category,${pivotData.columns.join(',')},Total\n`;
    
    pivotData.rows.forEach((row: string) => {
      const rowData = [row];
      let rowTotal = 0;
      pivotData.columns.forEach((col: string) => {
        const value = pivotData.data[row][col] || 0;
        rowTotal += value;
        rowData.push(value.toString());
      });
      rowData.push(rowTotal.toString());
      csvContent += rowData.join(',') + '\n';
    });
    
    csvContent += '\n';
    csvContent += '📊 PERCENTAGE BREAKDOWN\n';
    csvContent += `Category,${pivotData.columns.map((col: string) => `${col} %`).join(',')},Total %\n`;
    
    pivotData.rows.forEach((row: string) => {
      const rowData = [row];
      let rowTotal = 0;
      pivotData.columns.forEach((col: string) => {
        const value = pivotData.data[row][col] || 0;
        rowTotal += value;
        const percentage = grandTotal > 0 ? ((value / grandTotal) * 100).toFixed(1) : '0.0';
        rowData.push(`${percentage}%`);
      });
      const totalPercentage = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) : '0.0';
      rowData.push(`${totalPercentage}%`);
      csvContent += rowData.join(',') + '\n';
    });
  }
  
  return csvContent;
};

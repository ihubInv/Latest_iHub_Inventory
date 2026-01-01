import React, { useState, useRef } from 'react';
import { Upload, Download, AlertTriangle, CheckCircle, X, FileSpreadsheet, FileText, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface BulkUploadProps {
  onUpload: (data: any[]) => Promise<void>;
  onClose?: () => void;
}

interface UploadResult {
  success: boolean;
  message: string;
  errors?: string[];
  successCount?: number;
  totalCount?: number;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ onUpload, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expected headers for validation
  const expectedHeaders = [
    'uniqueid',
    'financialyear',
    'dateofinvoice',
    'invoicenumber',
    'assetcategory',
    'assetname',
    'specification',
    'makemodel',
    'productserialnumber',
    'vendorname',
    'quantityperitem',
    'rateinclusivetax',
    'totalcost',
    'locationofitem',
    'unitofmeasurement',
    'depreciationmethod',
    'expectedlifespan',
    'salvagevalue',
    'warrantyinformation',
    'maintenanceschedule',
    'conditionofasset',
    'status',
    'minimumstocklevel',
    'balancequantityinstock',
    'description'
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let data: any[] = [];
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',');
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index]?.trim() || '';
              });
              data.push(row);
            }
          }
        } else {
          // Parse Excel
          const workbook = XLSX.read(e.target?.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convert to object array
          if (data.length > 0) {
            const headers = data[0].map((h: any) => h.toString().toLowerCase().trim());
            const rows = data.slice(1);
            data = rows.map((row: any[]) => {
              const obj: any = {};
              headers.forEach((header: string, index: number) => {
                obj[header] = row[index] || '';
              });
              return obj;
            });
          }
        }

        // Validate headers
        const fileHeaders = Object.keys(data[0] || {});
        const missingHeaders = expectedHeaders.filter(h => !fileHeaders.includes(h));
        const extraHeaders = fileHeaders.filter(h => !expectedHeaders.includes(h));

        if (missingHeaders.length > 0) {
          setUploadResult({
            success: false,
            message: `Missing required headers: ${missingHeaders.join(', ')}`,
            errors: [`Please ensure all required columns are present in your file.`]
          });
          return;
        }

        setPreviewData(data.slice(0, 5)); // Show first 5 rows for preview
        setShowPreview(true);
        setUploadResult(null);
        
      } catch (error) {
        setUploadResult({
          success: false,
          message: 'Error parsing file',
          errors: ['Please check your file format and try again.']
        });
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Re-parse the full file for upload
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          let data: any[] = [];
          
          if (file.name.endsWith('.csv')) {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(',');
                const row: any = {};
                headers.forEach((header, index) => {
                  row[header] = values[index]?.trim() || '';
                });
                data.push(row);
              }
            }
          } else {
            const workbook = XLSX.read(e.target?.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (rawData.length > 0) {
              const headers = rawData[0].map((h: unknown) => String(h).toLowerCase().trim());
              const rows = rawData.slice(1);
              data = rows.map((row: unknown[]) => {
                const obj: any = {};
                headers.forEach((header: string, index: number) => {
                  obj[header] = row[index] || '';
                });
                return obj;
              });
            }
          }

          await onUpload(data);
          setUploadResult({
            success: true,
            message: 'Upload completed successfully!',
            successCount: data.length,
            totalCount: data.length
          });
          
        } catch (error) {
          setUploadResult({
            success: false,
            message: 'Upload failed',
            errors: [error instanceof Error ? error.message : 'Unknown error occurred']
          });
        } finally {
          setUploading(false);
        }
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
      
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Upload failed',
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      });
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      expectedHeaders,
      [
        'ihub/2024-25/LAP/Workstation-1/001', // uniqueid
        '2024-25', // financialyear
        '2024-01-15', // dateofinvoice
        'INV-001', // invoicenumber
        'Electronics', // assetcategory
        'Laptop Dell XPS', // assetname
        'Intel i7, 16GB RAM, 512GB SSD', // specification
        'Dell XPS 15', // makemodel
        'DL123456789', // productserialnumber
        'Dell Technologies', // vendorname
        '1', // quantityperitem
        '75000', // rateinclusivetax
        '75000', // totalcost
        'Workstation-1', // locationofitem
        'Pieces', // unitofmeasurement
        'straight-line', // depreciationmethod
        '3', // expectedlifespan
        '5000', // salvagevalue
        '3 years comprehensive', // warrantyinformation
        'Annual maintenance', // maintenanceschedule
        'excellent', // conditionofasset
        'available', // status
        '5', // minimumstocklevel
        '1', // balancequantityinstock
        'High-performance laptop for development work' // description
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Template');
    XLSX.writeFile(wb, 'inventory_bulk_upload_template.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-[#0d559e] via-[#1a6bb8] to-[#2c7bc7] rounded-2xl flex items-center justify-center shadow-lg">
          <Upload className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk Asset Upload</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload multiple inventory items at once using Excel or CSV files. Follow the template format for best results.
        </p>
      </div>

      <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10 border border-[#0d559e]/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Upload Guidelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-800">Headers must match exactly</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-800">Use correct data types</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-800">Download template below</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-800">Supports Excel & CSV files</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Template Download */}
          <div className="bg-gradient-to-r from-[#0d559e]/10 to-[#1a6bb8]/10 border border-[#0d559e]/20 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Excel Template</h3>
                  <p className="text-sm text-green-700">Download the template with all required columns and sample data</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Download size={18} className="text-blue-500" />
                <span className="font-medium">Download Template</span>
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 cursor-pointer group ${
              dragActive 
                ? 'border-[#0d559e] bg-gradient-to-br from-[#0d559e]/10 to-[#1a6bb8]/10 shadow-lg' 
                : 'border-gray-300 hover:border-[#0d559e] hover:bg-gradient-to-br hover:from-[#0d559e]/10 hover:to-[#1a6bb8]/10'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            
            <div className="space-y-6">
              {file ? (
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center space-x-2">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                      <FileSpreadsheet className="w-8 h-8 text-white" />
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-r from-[#0d559e] to-[#1a6bb8] rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xl font-semibold text-gray-900 mb-2">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-gray-500">
                      Supports Excel (.xlsx, .xls) and CSV files up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Data */}
          {showPreview && previewData.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Preview (First 5 rows)</h3>
              </div>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {Object.keys(previewData[0] || {}).slice(0, 6).map(header => (
                        <th key={header} className="px-3 py-2 text-left font-medium text-gray-700">
                          {header}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left font-medium text-gray-700">...</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        {Object.values(row).slice(0, 6).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 text-gray-900">
                            {value?.toString() || '-'}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-gray-500">...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className={`border rounded-lg p-4 ${
              uploadResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                {uploadResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    uploadResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {uploadResult.message}
                  </h3>
                  {uploadResult.success && uploadResult.successCount && (
                    <p className="text-sm text-green-800">
                      Successfully uploaded {uploadResult.successCount} items
                    </p>
                  )}
                  {uploadResult.errors && (
                    <ul className="mt-2 text-sm text-red-800 space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {file && showPreview && !uploadResult?.success && (
            <div className="flex justify-center pt-6">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg font-semibold"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading {previewData.length} Items...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload {previewData.length} Items</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
    </div>
  );
};

export default BulkUpload;

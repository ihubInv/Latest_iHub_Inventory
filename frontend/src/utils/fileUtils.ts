// File utility functions for upload and validation

/**
 * Sanitize file names for storage
 * Removes special characters and makes the filename URL-safe
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .toLowerCase(); // Convert to lowercase for consistency
};

/**
 * Validate if file type is supported for upload
 */
export const validateFileType = (file: File): boolean => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
    // Documents
    'application/pdf',
    'text/plain', 'text/csv',
    // Office Documents
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint', // .ppt
    // Archives
    'application/zip',
    'application/x-rar-compressed'
  ];
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size (default: 50MB limit)
 */
export const validateFileSize = (file: File, maxSizeMB: number = 50): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Get human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate unique file path for storage
 */
export const generateFilePath = (fileName: string, folder: string = 'attachments'): string => {
  const sanitizedName = sanitizeFileName(fileName);
  const timestamp = Date.now();
  return `${folder}/${timestamp}-${sanitizedName}`;
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file is an image based on MIME type
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Check if file is a document based on MIME type
 */
export const isDocumentFile = (file: File): boolean => {
  const documentTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ];
  return documentTypes.includes(file.type);
};

/**
 * Validate multiple files at once
 */
export const validateFiles = (files: File[]): { valid: File[]; invalid: { file: File; reason: string }[] } => {
  const valid: File[] = [];
  const invalid: { file: File; reason: string }[] = [];

  files.forEach(file => {
    if (!validateFileType(file)) {
      invalid.push({ file, reason: 'File type not supported' });
    } else if (!validateFileSize(file)) {
      invalid.push({ file, reason: 'File too large (max 50MB)' });
    } else {
      valid.push(file);
    }
  });

  return { valid, invalid };
};

/**
 * Accepted file types for HTML input accept attribute
 */
export const ACCEPTED_FILE_TYPES = "image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx,.zip,.rar";

/**
 * Human-readable list of supported file types
 */
export const SUPPORTED_FILE_TYPES_DESCRIPTION = "Images, PDFs, Documents, Spreadsheets, Presentations, Archives";

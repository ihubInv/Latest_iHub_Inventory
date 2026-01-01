import toast from 'react-hot-toast';
import type { ToastOptions } from 'react-hot-toast';

// Custom toast configuration
const defaultToastOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#fff',
    color: '#374151',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '16px',
    maxWidth: '400px',
    fontSize: '14px',
    fontWeight: '500',
  },
};

// Success Toast
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    ...defaultToastOptions,
    ...options,
    icon: '🎉',
    style: {
      ...defaultToastOptions.style,
      background: '#f0fdf4',
      color: '#166534',
      border: '1px solid #bbf7d0',
    },
  });
};

// Error Toast
export const showErrorToast = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    ...defaultToastOptions,
    duration: 6000,
    ...options,
    icon: '❌',
    style: {
      ...defaultToastOptions.style,
      background: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca',
    },
  });
};

// Warning Toast
export const showWarningToast = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...defaultToastOptions,
    ...options,
    icon: '⚠️',
    style: {
      ...defaultToastOptions.style,
      background: '#fffbeb',
      color: '#d97706',
      border: '1px solid #fed7aa',
    },
  });
};

// Info Toast
export const showInfoToast = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...defaultToastOptions,
    ...options,
    icon: 'ℹ️',
    style: {
      ...defaultToastOptions.style,
      background: '#eff6ff',
      color: '#2563eb',
      border: '1px solid #bfdbfe',
    },
  });
};

// Loading Toast
export const showLoadingToast = (message: string, options?: ToastOptions) => {
  return toast.loading(message, {
    ...defaultToastOptions,
    duration: Infinity,
    ...options,
    style: {
      ...defaultToastOptions.style,
      background: '#f0f9ff',
      color: '#0369a1',
      border: '1px solid #7dd3fc',
    },
  });
};

// Promise Toast (for async operations)
export const showPromiseToast = <T,>(
  promise: Promise<T>,
  {
    loading,
    success,
    error,
  }: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options?: ToastOptions
) => {
  return toast.promise(
    promise,
    {
      loading,
      success,
      error,
    },
    {
      ...defaultToastOptions,
      ...options,
      style: {
        ...defaultToastOptions.style,
        ...options?.style,
      },
    }
  );
};

// Utility functions for common CRUD operations
export const CRUDToasts = {
  // Create operations
  creating: (entity: string) => showLoadingToast(`Creating ${entity}...`),
  created: (entity: string) => showSuccessToast(`${entity} created successfully! 🎉`),
  createError: (entity: string, error?: string) => 
    showErrorToast(`Failed to create ${entity}${error ? `: ${error}` : ''}`),

  // Read operations
  loading: (entity: string) => showLoadingToast(`Loading ${entity}...`),
  loaded: (entity: string, count?: number) => 
    showInfoToast(`${entity} loaded successfully${count ? ` (${count} items)` : ''}`),
  loadError: (entity: string, error?: string) => 
    showErrorToast(`Failed to load ${entity}${error ? `: ${error}` : ''}`),

  // Update operations
  updating: (entity: string) => showLoadingToast(`Updating ${entity}...`),
  updated: (entity: string) => showSuccessToast(`${entity} updated successfully! ✨`),
  updateError: (entity: string, error?: string) => 
    showErrorToast(`Failed to update ${entity}${error ? `: ${error}` : ''}`),

  // Delete operations
  deleting: (entity: string) => showLoadingToast(`Deleting ${entity}...`),
  deleted: (entity: string) => showSuccessToast(`${entity} deleted successfully! 🗑️`),
  deleteError: (entity: string, error?: string) => 
    showErrorToast(`Failed to delete ${entity}${error ? `: ${error}` : ''}`),

  // Bulk operations
  bulkUploading: (count: number) => showLoadingToast(`Uploading ${count} items...`),
  bulkUploaded: (count: number) => showSuccessToast(`${count} items uploaded successfully! 📊`),
  bulkUploadError: (error?: string) => showErrorToast(`Bulk upload failed${error ? `: ${error}` : ''}`),
  bulkDeleting: (count: number) => showLoadingToast(`Deleting ${count} items...`),
  bulkDeleted: (count: number) => showSuccessToast(`${count} items deleted successfully! 🗑️`),
  bulkDeleteError: (error?: string) => showErrorToast(`Bulk delete failed${error ? `: ${error}` : ''}`),
};

// Authentication toasts
export const AuthToasts = {
  // Login
  loggingIn: () => showLoadingToast('Signing you in...'),
  loginSuccess: (userName?: string) => 
    showSuccessToast(`Welcome back${userName ? `, ${userName}` : ''}! 👋`),
  loginError: (error?: string) => showErrorToast(`Login failed${error ? `: ${error}` : ''}`),

  // Logout
  loggingOut: () => showLoadingToast('Signing you out...'),
  logoutSuccess: () => showInfoToast('You have been signed out successfully. See you soon! 👋'),
  logoutError: (error?: string) => showErrorToast(`Logout failed${error ? `: ${error}` : ''}`),

  // Registration
  registering: () => showLoadingToast('Creating your account...'),
  registerSuccess: () => showSuccessToast('Account created successfully! Welcome aboard! 🎉'),
  registerError: (error?: string) => showErrorToast(`Registration failed${error ? `: ${error}` : ''}`),

  // Session
  sessionExpired: () => showWarningToast('Your session has expired. Please sign in again.'),
  sessionRestored: () => showInfoToast('Welcome back! Your session has been restored.'),
};

export default {
  success: showSuccessToast,
  error: showErrorToast,
  warning: showWarningToast,
  info: showInfoToast,
  loading: showLoadingToast,
  promise: showPromiseToast,
  crud: CRUDToasts,
  auth: AuthToasts,
  dismiss: toast.dismiss,
  remove: toast.remove,
};

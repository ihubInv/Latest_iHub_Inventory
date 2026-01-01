/**
 * Utility functions for safe date formatting
 */

/**
 * Safely formats a date string or Date object to a localized date string
 * @param dateInput - Date string, Date object, or undefined/null
 * @param fallback - Fallback text when date is invalid (default: 'N/A')
 * @returns Formatted date string or fallback
 */
export const formatDate = (dateInput: string | Date | undefined | null, fallback: string = 'N/A'): string => {
  if (!dateInput) return fallback;
  
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Date formatting error:', error);
    return fallback;
  }
};

/**
 * Safely formats a date string or Date object to a localized date and time string
 * @param dateInput - Date string, Date object, or undefined/null
 * @param fallback - Fallback text when date is invalid (default: 'N/A')
 * @returns Formatted date and time string or fallback
 */
export const formatDateTime = (dateInput: string | Date | undefined | null, fallback: string = 'N/A'): string => {
  if (!dateInput) return fallback;
  
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleString();
  } catch (error) {
    console.warn('DateTime formatting error:', error);
    return fallback;
  }
};

/**
 * Safely formats a date string or Date object to a relative time string (e.g., "2 days ago")
 * @param dateInput - Date string, Date object, or undefined/null
 * @param fallback - Fallback text when date is invalid (default: 'Unknown')
 * @returns Relative time string or fallback
 */
export const formatRelativeDate = (dateInput: string | Date | undefined | null, fallback: string = 'Unknown'): string => {
  if (!dateInput) return fallback;
  
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'today';
    if (diffDays === 2) return 'yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  } catch (error) {
    console.warn('Relative date formatting error:', error);
    return fallback;
  }
};

/**
 * Validates if a date string is valid
 * @param dateInput - Date string to validate
 * @returns true if valid, false otherwise
 */
export const isValidDate = (dateInput: string | Date | undefined | null): boolean => {
  if (!dateInput) return false;
  
  try {
    const date = new Date(dateInput);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

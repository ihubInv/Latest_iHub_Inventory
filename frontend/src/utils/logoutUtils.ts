/**
 * Comprehensive logout utilities to clear all storage and cancel network requests
 */

// Comprehensive storage clearing
export const clearAllStorage = (): void => {
  try {
    // Clear localStorage completely
    localStorage.clear()
    
    // Clear sessionStorage completely
    sessionStorage.clear()
    
    // Clear any cached data in browsers that support it
    if (typeof window !== 'undefined') {
      // Clear IndexedDB if used
      if ('indexedDB' in window) {
        // Note: IndexedDB clearing would require specific database names
        console.log('📱 IndexedDB detected - manual clearing may be required')
      }
      
      // Clear any service worker caches
      if ('serviceWorker' in navigator && 'caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName).catch(console.warn)
          })
        }).catch(console.warn)
      }
      
      // Clear any additional storage keys the app might use
      const additionalKeys = [
        // UI state keys
        'sidebarCollapsed',
        'themePreference', 
        'userPreferences',
        'lastVisited',
        
        // Business data keys
        'issuanceAuditTrail',
        'formCache',
        'paginationState',
        'searchHistory',
        'recentItems',
        
        // Session keys
        'sessionTimeout',
        'lastActivity',
        'loginAttempts',
        
        // Cache keys
        'apiCache',
        'routeCache',
        'componentCache'
      ]
      
      additionalKeys.forEach(key => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
      
      console.log('🧹 All storage cleared successfully')
    }
  } catch (error) {
    console.error('❌ Error clearing storage:', error)
  }
}

// Cancel all pending network requests
export const cancelPendingRequests = (dispatch: any): void => {
  try {
    // Reset RTK Query API state to cancel all pending requests
    dispatch({ type: 'api/reset' })
    
    // If using other HTTP clients, cancel them here
    // Example: axios cancel tokens, fetch AbortController, etc.
    
    console.log('🚫 All pending network requests cancelled')
  } catch (error) {
    console.error('❌ Error cancelling requests:', error)
  }
}

// Comprehensive logout handler
export const performCompleteLogout = async (
  dispatch: any,
  logoutApiCall: () => Promise<any>,
  navigate: (path: string) => void,
  showToast: (message: string, type?: 'success' | 'error') => void
): Promise<void> => {
  try {
    console.log('🔓 Starting comprehensive logout...')
    
    // Step 1: Call logout API
    console.log('📡 Calling logout API...')
    await logoutApiCall()
    
    // Step 2: Clear all storage
    console.log('🧹 Clearing all storage...')
    clearAllStorage()
    
    // Step 3: Cancel all requests
    console.log('🚫 Cancelling network requests...')
    cancelPendingRequests(dispatch)
    
    // Step 4: Navigate to login
    console.log('🏠 Navigating to login...')
    navigate('/login')
    
    // Step 5: Show success message
    showToast('Logged out successfully')
    
    console.log('✅ Comprehensive logout completed')
  } catch (error) {
    console.error('❌ Logout error:', error)
    
    // Even if API fails, clear local data
    try {
      clearAllStorage()
      cancelPendingRequests(dispatch)
      navigate('/login')
      showToast('Logged out (some cleanup may have failed)', 'error')
    } catch (cleanupError) {
      console.error('❌ Cleanup error:', cleanupError)
      // Force navigation even if everything fails
      navigate('/login')
    }
  }
}

// Quick cleanup function for emergency logout
export const emergencyLogout = (navigate: (path: string) => void): void => {
  try {
    console.log('🚨 Emergency logout triggered')
    
    // Clear all storage immediately
    clearAllStorage()
    
    // Navigate to login
    navigate('/login')
    
    console.log('🚨 Emergency logout completed')
  } catch (error) {
    console.error('❌ Emergency logout error:', error)
    // Force reload if everything fails
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

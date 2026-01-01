import SessionManager from './sessionManager';

/**
 * Development utility to test session management
 * Only available in development mode
 */
class SessionTestUtils {
  private static instance: SessionTestUtils;
  private sessionManager: SessionManager;

  private constructor() {
    this.sessionManager = SessionManager.getInstance();
  }

  public static getInstance(): SessionTestUtils {
    if (!SessionTestUtils.instance) {
      SessionTestUtils.instance = new SessionTestUtils();
    }
    return SessionTestUtils.instance;
  }

  /**
   * Set session timeout for testing (in milliseconds)
   * @param timeout Timeout in milliseconds
   */
  public setSessionTimeout(timeout: number): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('SessionTestUtils is only available in development mode');
      return;
    }

    // Access the private sessionTimeout property through the instance
    (this.sessionManager as any).sessionTimeout = timeout;
    console.log(`Session timeout set to ${timeout}ms (${timeout / 1000} seconds)`);
  }

  /**
   * Set warning timeout for testing (in milliseconds)
   * @param timeout Warning timeout in milliseconds
   */
  public setWarningTimeout(timeout: number): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('SessionTestUtils is only available in development mode');
      return;
    }

    (this.sessionManager as any).warningTimeout = timeout;
    console.log(`Warning timeout set to ${timeout}ms (${timeout / 1000} seconds)`);
  }

  /**
   * Get current session timeout
   */
  public getSessionTimeout(): number {
    return (this.sessionManager as any).sessionTimeout;
  }

  /**
   * Get current warning timeout
   */
  public getWarningTimeout(): number {
    return (this.sessionManager as any).warningTimeout;
  }

  /**
   * Get remaining session time
   */
  public getRemainingTime(): number {
    return this.sessionManager.getRemainingTime();
  }

  /**
   * Check if session is valid
   */
  public isSessionValid(): boolean {
    return this.sessionManager.isSessionValid();
  }

  /**
   * Force session timeout for testing
   */
  public forceTimeout(): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('SessionTestUtils is only available in development mode');
      return;
    }

    console.log('Forcing session timeout...');
    (this.sessionManager as any).handleSessionTimeout();
  }

  /**
   * Show warning for testing
   */
  public showWarning(): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('SessionTestUtils is only available in development mode');
      return;
    }

    console.log('Showing session warning...');
    (this.sessionManager as any).showLogoutWarning();
  }

  /**
   * Print session info for debugging
   */
  public printSessionInfo(): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('SessionTestUtils is only available in development mode');
      return;
    }

    console.log('=== Session Info ===');
    console.log('Session Valid:', this.isSessionValid());
    console.log('Remaining Time:', this.getRemainingTime(), 'ms');
    console.log('Remaining Time (formatted):', this.formatTime(this.getRemainingTime()));
    console.log('Session Timeout:', this.getSessionTimeout(), 'ms');
    console.log('Warning Timeout:', this.getWarningTimeout(), 'ms');
    console.log('==================');
  }

  /**
   * Format time in milliseconds to readable format
   */
  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Make it available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).SessionTestUtils = SessionTestUtils.getInstance();
  console.log('SessionTestUtils available globally as window.SessionTestUtils');
  console.log('Available methods:');
  console.log('- setSessionTimeout(ms) - Set session timeout');
  console.log('- setWarningTimeout(ms) - Set warning timeout');
  console.log('- getRemainingTime() - Get remaining session time');
  console.log('- isSessionValid() - Check if session is valid');
  console.log('- forceTimeout() - Force session timeout');
  console.log('- showWarning() - Show warning notification');
  console.log('- printSessionInfo() - Print all session info');
}

export default SessionTestUtils;

import { store } from '../store';
import { logoutUserByTimeout } from '../store/slices/authSlice';

export interface SessionData {
  loginTime: number;
  lastActivity: number;
  userId: string;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionTimeout: number = 60 * 60 * 1000; // 1 hour in milliseconds
  private warningTimeout: number = 5 * 60 * 1000; // 5 minutes warning before logout
  private warningShown: boolean = false;
  private warningTimer: NodeJS.Timeout | null = null;
  private logoutTimer: NodeJS.Timeout | null = null;
  private activityListeners: (() => void)[] = [];

  private constructor() {
    this.setupActivityListeners();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Start session management for a logged-in user
   */
  public startSession(userId: string): void {
    try {
      const sessionData: SessionData = {
        loginTime: Date.now(),
        lastActivity: Date.now(),
        userId,
      };

      // Store session data in sessionStorage
      sessionStorage.setItem('sessionData', JSON.stringify(sessionData));
      
      // Clear any existing timers
      this.clearTimers();
      
      // Reset warning flag
      this.warningShown = false;
      
      // Set up logout timer
      this.setupLogoutTimer();
      
      console.log('Session started for user:', userId);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  /**
   * Update last activity time and reset timers
   */
  public updateActivity(): void {
    try {
      const sessionData = this.getSessionData();
      if (sessionData) {
        sessionData.lastActivity = Date.now();
        sessionStorage.setItem('sessionData', JSON.stringify(sessionData));
        
        // Clear existing timers and set new ones
        this.clearTimers();
        this.warningShown = false;
        this.setupLogoutTimer();
      }
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }

  /**
   * End the current session
   */
  public endSession(): void {
    this.clearTimers();
    sessionStorage.removeItem('sessionData');
    this.warningShown = false;
    console.log('Session ended');
  }

  /**
   * Check if session is still valid
   */
  public isSessionValid(): boolean {
    const sessionData = this.getSessionData();
    if (!sessionData) return false;

    const now = Date.now();
    const timeSinceLastActivity = now - sessionData.lastActivity;
    
    return timeSinceLastActivity < this.sessionTimeout;
  }

  /**
   * Get remaining session time in milliseconds
   */
  public getRemainingTime(): number {
    const sessionData = this.getSessionData();
    if (!sessionData) return 0;

    const now = Date.now();
    const timeSinceLastActivity = now - sessionData.lastActivity;
    const remainingTime = this.sessionTimeout - timeSinceLastActivity;
    
    return Math.max(0, remainingTime);
  }

  /**
   * Get session data from sessionStorage
   */
  private getSessionData(): SessionData | null {
    try {
      const data = sessionStorage.getItem('sessionData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading session data:', error);
      return null;
    }
  }

  /**
   * Set up logout timer
   */
  private setupLogoutTimer(): void {
    const warningTime = this.sessionTimeout - this.warningTimeout;
    
    // Set warning timer
    this.warningTimer = setTimeout(() => {
      this.showLogoutWarning();
    }, warningTime);

    // Set logout timer
    this.logoutTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout);
  }

  /**
   * Show logout warning to user
   */
  private showLogoutWarning(): void {
    if (this.warningShown) return;
    
    this.warningShown = true;
    
    // Show warning notification
    const warningMessage = `Your session will expire in 5 minutes due to inactivity. Click anywhere to extend your session.`;
    
    // Create a custom warning notification
    this.showCustomWarning(warningMessage);
    
    console.warn('Session warning: User will be logged out in 5 minutes');
  }

  /**
   * Handle session timeout - logout user
   */
  private handleSessionTimeout(): void {
    console.log('Session timeout: Logging out user');
    
    // Dispatch timeout logout action
    store.dispatch(logoutUserByTimeout());
    
    // Clear session data
    this.endSession();
    
    // Show timeout notification
    this.showSessionTimeoutNotification();
  }

  /**
   * Set up activity listeners to detect user activity
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, this.handleUserActivity.bind(this), true);
    });

    // Also listen for visibility change (when user switches tabs)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Handle user activity - update last activity time
   */
  private handleUserActivity(): void {
    this.updateActivity();
  }

  /**
   * Handle visibility change - update activity when user returns to tab
   */
  private handleVisibilityChange(): void {
    if (!document.hidden) {
      this.updateActivity();
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }

  /**
   * Show custom warning notification
   */
  private showCustomWarning(message: string): void {
    // Create warning element
    const warningDiv = document.createElement('div');
    warningDiv.id = 'session-warning';
    warningDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
    `;
    
    warningDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="font-size: 18px;">⚠️</div>
        <div>${message}</div>
      </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    // Add click handler to dismiss warning
    warningDiv.addEventListener('click', () => {
      warningDiv.remove();
      this.warningShown = false;
      this.updateActivity(); // Extend session
    });
    
    document.body.appendChild(warningDiv);
    
    // Auto-remove after 10 seconds if not clicked
    setTimeout(() => {
      if (document.getElementById('session-warning')) {
        document.getElementById('session-warning')?.remove();
      }
    }, 10000);
  }

  /**
   * Show session timeout notification
   */
  private showSessionTimeoutNotification(): void {
    const timeoutDiv = document.createElement('div');
    timeoutDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #dc2626;
      color: white;
      padding: 24px 32px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      animation: fadeIn 0.3s ease-out;
    `;
    
    timeoutDiv.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 12px;">🔒</div>
      <div style="font-weight: 600; margin-bottom: 8px;">Session Expired</div>
      <div>You have been logged out due to inactivity. Please log in again.</div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(timeoutDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      timeoutDiv.remove();
    }, 5000);
  }

  /**
   * Clean up listeners and timers
   */
  public destroy(): void {
    this.clearTimers();
    this.endSession();
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity.bind(this), true);
    });
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
}

export default SessionManager;

/**
 * @interface AuthService
 * Defines the contract that any authentication implementation must fulfill.
 */
export class AuthService {
  /**
   * Initialize the authentication service
   */
  constructor() {
    if (this.constructor === AuthService) {
      throw new Error('AuthService is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Sign in with Google
   * @returns {Promise<Object>} Promise resolving to user object or null
   */
  async signInWithGoogle() {
    throw new Error('Method signInWithGoogle() must be implemented');
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>} Promise resolving when sign out is complete
   */
  async signOut() {
    throw new Error('Method signOut() must be implemented');
  }

  /**
   * Get the current authenticated user
   * @returns {Object|null} Current user object or null if not authenticated
   */
  getCurrentUser() {
    throw new Error('Method getCurrentUser() must be implemented');
  }

  /**
   * Check if user is currently authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    throw new Error('Method isAuthenticated() must be implemented');
  }

  /**
   * Set up authentication state listener
   * @param {Function} callback - Callback function to be called on auth state changes
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChanged(callback) {
    throw new Error('Method onAuthStateChanged() must be implemented');
  }

  /**
   * Checks if the authentication service is available
   * @returns {boolean} True if the service is available
   */
  isAvailable() {
    throw new Error('Method isAvailable() must be implemented');
  }
}

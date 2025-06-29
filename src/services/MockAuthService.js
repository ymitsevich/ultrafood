import { AuthService } from './interfaces/AuthService.js';

/**
 * Mock implementation of the AuthService interface for testing
 */
export class MockAuthService extends AuthService {
  constructor() {
    super();
    
    // In test environment, start with a mock user already authenticated
    this.currentUser = {
      uid: 'mock-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://via.placeholder.com/100'
    };
    this.authStateListeners = [];
    
    console.log('MockAuthService initialized with authenticated test user:', this.currentUser);
    
    // Bind methods to ensure 'this' context is preserved
    this.signInWithGoogle = this.signInWithGoogle.bind(this);
    this.signOut = this.signOut.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.onAuthStateChanged = this.onAuthStateChanged.bind(this);
    this.isAvailable = this.isAvailable.bind(this);
  }

  /**
   * @inheritdoc
   */
  async signInWithGoogle() {
    // Simulate a successful login
    const mockUser = {
      uid: 'mock-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://via.placeholder.com/100'
    };
    
    this.currentUser = mockUser;
    
    // Notify all listeners
    this.authStateListeners.forEach(callback => callback(mockUser));
    
    console.log('Mock user signed in:', mockUser);
    return mockUser;
  }

  /**
   * @inheritdoc
   */
  async signOut() {
    this.currentUser = null;
    
    // Notify all listeners
    this.authStateListeners.forEach(callback => callback(null));
    
    console.log('Mock user signed out');
  }

  /**
   * @inheritdoc
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * @inheritdoc
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * @inheritdoc
   */
  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * @inheritdoc
   */
  isAvailable() {
    return true; // Mock service is always available
  }
}

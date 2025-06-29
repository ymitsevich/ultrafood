import { AuthService } from './interfaces/AuthService.js';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';

/**
 * Firebase implementation of the AuthService interface
 */
export class FirebaseAuthService extends AuthService {
  constructor() {
    super();
    
    // Firebase connection state
    this.isFirebaseInitialized = false;
    this.auth = null;
    this.provider = null;
    this.currentUser = null;
    
    // Your web app's Firebase configuration
    // Using environment variables or import.meta.env for Vite projects
    this.firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key-for-development",
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "demo",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo",
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "demo"
    };
    
    // Initialize Firebase
    this.initializeFirebase();
    
    // Bind methods to ensure 'this' context is preserved
    this.signInWithGoogle = this.signInWithGoogle.bind(this);
    this.signOut = this.signOut.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.onAuthStateChanged = this.onAuthStateChanged.bind(this);
    this.isAvailable = this.isAvailable.bind(this);
  }
  
  /**
   * Initialize Firebase Auth
   * @private
   */
  initializeFirebase() {
    try {
      console.log('Initializing Firebase Auth...');
      
      // Initialize Firebase app - reuse the same config as database service
      let app;
      try {
        app = initializeApp(this.firebaseConfig);
      } catch (error) {
        // App might already be initialized by FirebaseDatabaseService
        if (error.code === 'app/duplicate-app') {
          // Import getApps and getApp dynamically to avoid issues
          import('firebase/app').then(({ getApps, getApp }) => {
            app = getApps().length > 0 ? getApp() : initializeApp(this.firebaseConfig);
            this.setupAuth(app);
          }).catch(err => {
            console.error('Error getting Firebase app:', err);
          });
          return false; // Will be set up asynchronously
        } else {
          throw error;
        }
      }
      
      if (app) {
        this.setupAuth(app);
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing Firebase Auth:', error);
      this.isFirebaseInitialized = false;
      return false;
    }
  }
  
  /**
   * Set up auth with Firebase app
   * @private
   */
  setupAuth(app) {
    try {
      this.auth = getAuth(app);
      this.provider = new GoogleAuthProvider();
      
      // Configure Google provider
      this.provider.addScope('email');
      this.provider.addScope('profile');
      
      console.log('Firebase Auth initialized successfully');
      this.isFirebaseInitialized = true;
    } catch (error) {
      console.error('Error setting up Firebase Auth:', error);
      this.isFirebaseInitialized = false;
    }
  }

  /**
   * @inheritdoc
   */
  async signInWithGoogle() {
    if (!this.auth || !this.isFirebaseInitialized) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      const result = await signInWithPopup(this.auth, this.provider);
      const user = result.user;
      
      this.currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
      
      console.log('User signed in:', this.currentUser);
      return this.currentUser;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  async signOut() {
    if (!this.auth || !this.isFirebaseInitialized) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      await firebaseSignOut(this.auth);
      this.currentUser = null;
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  getCurrentUser() {
    if (this.auth && this.auth.currentUser) {
      return {
        uid: this.auth.currentUser.uid,
        email: this.auth.currentUser.email,
        displayName: this.auth.currentUser.displayName,
        photoURL: this.auth.currentUser.photoURL
      };
    }
    return this.currentUser;
  }

  /**
   * @inheritdoc
   */
  isAuthenticated() {
    return !!(this.auth && this.auth.currentUser);
  }

  /**
   * @inheritdoc
   */
  onAuthStateChanged(callback) {
    if (!this.auth || !this.isFirebaseInitialized) {
      console.warn('Firebase Auth not initialized, cannot set up auth state listener');
      return () => {}; // Return empty unsubscribe function
    }

    return onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
      } else {
        this.currentUser = null;
      }
      callback(this.currentUser);
    });
  }

  /**
   * @inheritdoc
   */
  isAvailable() {
    return this.isFirebaseInitialized;
  }
}

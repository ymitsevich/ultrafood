// Import the Firebase SDK
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  setDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

// Control flag to operate in local-only mode (no Firebase connections attempted)
// Set this to false when you've created your Firestore database in the Firebase Console
// Note: Firebase uses "(default)" as the default database name - this is correct and doesn't need to be changed
const LOCAL_ONLY_MODE = false;

// Firebase connection state
let isFirebaseConnected = false;
let isFirebaseInitialized = false;

// Your web app's Firebase configuration
// Using environment variables or import.meta.env for Vite projects
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key-for-development",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "demo",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "demo"
};

// Initialize Firebase with exponential backoff retry
let app;
let db;
let retries = 0;
const MAX_RETRIES = 1;

// In-memory storage for local-only mode
const localFoodItems = [];
const localSubmittedMeals = []; // Add storage for submitted meals

function initializeFirebase() {
  // Skip initialization in local-only mode
  if (LOCAL_ONLY_MODE) {
    console.log('Running in local-only mode. No Firebase connections will be attempted.');
    return false;
  }

  try {
    console.log('Initializing Firebase...');
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    
    console.log('Firebase initialized successfully');
    isFirebaseInitialized = true;
    
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    isFirebaseInitialized = false;
    
    if (retries < MAX_RETRIES) {
      retries++;
      const backoffTime = Math.pow(2, retries) * 1000;
      console.log(`Retrying Firebase initialization in ${backoffTime}ms...`);
      
      setTimeout(() => {
        initializeFirebase();
      }, backoffTime);
    }
    
    return false;
  }
}

// Initialize Firebase only if not in local-only mode
if (!LOCAL_ONLY_MODE) {
  initializeFirebase();
} else {
  console.log('Firebase is in local-only mode. To enable cloud features:');
  console.log('1. Create a Firestore database in the Firebase Console');
  console.log('2. Set LOCAL_ONLY_MODE to false in firebase.js');
}

// Disable analytics in development environment to avoid errors
let analytics = null;
try {
  if (app && !LOCAL_ONLY_MODE) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  if (!LOCAL_ONLY_MODE) {
    console.warn('Firebase Analytics failed to initialize:', error);
  }
}

/**
 * Save food item to local storage or Firestore
 * @param {Object} foodItem - The food item data to save
 * @returns {Promise<string|null>} - Promise that resolves with the document ID or null on error
 */
export async function saveFoodItem(foodItem) {
  // In local-only mode, save to memory
  if (LOCAL_ONLY_MODE) {
    const customId = foodItem.id || `custom_${Date.now()}`;
    const itemToSave = {
      ...foodItem,
      id: customId,
      firestoreId: customId,
      updatedAt: new Date().toISOString()
    };
    
    // Add to local storage
    const existingIndex = localFoodItems.findIndex(item => item.id === customId);
    if (existingIndex >= 0) {
      localFoodItems[existingIndex] = itemToSave;
    } else {
      localFoodItems.push(itemToSave);
    }
    
    console.log("Food item saved locally with ID:", customId);
    return customId;
  }

  // Save to Firestore if available
  if (!db || !isFirebaseInitialized) {
    console.error("Firestore not initialized yet");
    return null;
  }

  try {
    // Use a custom ID based on timestamp to avoid document ID conflicts
    const customId = foodItem.id || `custom_${Date.now()}`;
    
    // Use setDoc with merge to handle both new and existing documents
    await setDoc(doc(db, "food-items", customId), {
      ...foodItem,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log("Food item saved to Firestore with ID:", customId);
    return customId;
  } catch (error) {
    console.error("Error saving food item to Firestore:", error);
    // Return null instead of throwing to prevent app crashes
    return null;
  }
}

/**
 * Get all food items from storage
 * @returns {Promise<Array>} - Promise that resolves with an array of food items
 */
export async function getFoodItems() {
  // In local-only mode, return local memory items
  if (LOCAL_ONLY_MODE) {
    return localFoodItems;
  }

  if (!db || !isFirebaseInitialized) {
    console.warn("Firestore not initialized yet, returning empty array");
    return [];
  }

  // Create a timeout promise that rejects after specified time
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Firestore operation timed out')), 3000);
  });
  
  try {
    // Race between the actual query and the timeout
    const queryPromise = getDocs(collection(db, "food-items"));
    const querySnapshot = await Promise.race([queryPromise, timeout]);
    
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      firestoreId: doc.id,
      ...doc.data()
    }));
    
    console.log(`Retrieved ${items.length} food items from Firestore`);
    return items;
  } catch (error) {
    console.warn("Error getting food items from Firestore:", error.message);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
}

/**
 * Update a food item in storage
 * @param {string} id - The ID of the food item
 * @param {Object} data - The updated data
 */
export async function updateFoodItem(id, data) {
  // In local-only mode, update in memory
  if (LOCAL_ONLY_MODE) {
    const index = localFoodItems.findIndex(item => item.id === id);
    if (index >= 0) {
      localFoodItems[index] = {
        ...localFoodItems[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      console.log("Food item updated locally:", id);
    }
    return;
  }

  if (!db) {
    console.error("Firestore not initialized yet");
    return;
  }

  try {
    const foodRef = doc(db, "food-items", id);
    await updateDoc(foodRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    console.log("Food item updated in Firestore:", id);
  } catch (error) {
    console.error("Error updating food item:", error);
  }
}

/**
 * Delete a food item from storage
 * @param {string} id - The ID of the food item
 */
export async function deleteFoodItem(id) {
  // In local-only mode, delete from memory
  if (LOCAL_ONLY_MODE) {
    const index = localFoodItems.findIndex(item => item.id === id);
    if (index >= 0) {
      localFoodItems.splice(index, 1);
      console.log("Food item deleted locally:", id);
    }
    return;
  }

  if (!db) {
    console.error("Firestore not initialized yet");
    return;
  }

  try {
    await deleteDoc(doc(db, "food-items", id));
    console.log("Food item deleted from Firestore:", id);
  } catch (error) {
    console.error("Error deleting food item:", error);
  }
}

/**
 * Save submitted meal to local storage or Firestore
 * @param {Array} basketItems - The basket items that make up the meal
 * @param {String} timestamp - The time the meal was consumed
 * @returns {Promise<string|null>} - Promise that resolves with the document ID or null on error
 */
export async function saveSubmittedMeal(basketItems, timestamp) {
  const submittedMeal = {
    id: `meal_${Date.now()}`,
    items: basketItems,
    timestamp: timestamp || new Date().toISOString(),
    submittedAt: new Date().toISOString()
  };

  // In local-only mode, save to memory
  if (LOCAL_ONLY_MODE) {
    localSubmittedMeals.push(submittedMeal);
    console.log("Meal saved locally with ID:", submittedMeal.id);
    return submittedMeal.id;
  }

  // Save to Firestore if available
  if (!db || !isFirebaseInitialized) {
    console.error("Firestore not initialized yet");
    return null;
  }

  try {
    // Save the submitted meal to a new collection
    await setDoc(doc(db, "submitted-meals", submittedMeal.id), submittedMeal);
    console.log("Meal saved to Firestore with ID:", submittedMeal.id);
    return submittedMeal.id;
  } catch (error) {
    console.error("Error saving meal to Firestore:", error);
    return null;
  }
}

/**
 * Get submitted meals from storage
 * @param {Number} maxItems - Maximum number of meals to return
 * @returns {Promise<Array>} - Promise that resolves with an array of submitted meals
 */
export async function getSubmittedMeals(maxItems = 100) {
  // In local-only mode, return local memory items
  if (LOCAL_ONLY_MODE) {
    return localSubmittedMeals;
  }

  if (!db || !isFirebaseInitialized) {
    console.warn("Firestore not initialized yet, returning empty array");
    return [];
  }

  // Create a timeout promise that rejects after specified time
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Firestore operation timed out')), 3000);
  });
  
  try {
    // Race between the actual query and the timeout
    const mealsQuery = query(
      collection(db, "submitted-meals"), 
      orderBy("submittedAt", "desc"),
      limit(maxItems)
    );
    const queryPromise = getDocs(mealsQuery);
    const querySnapshot = await Promise.race([queryPromise, timeout]);
    
    const meals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`Retrieved ${meals.length} submitted meals from Firestore`);
    return meals;
  } catch (error) {
    console.warn("Error getting submitted meals from Firestore:", error.message);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
}

/**
 * Check if Firebase is connected and available
 * @returns {boolean} - Whether Firebase is available
 */
export function isFirebaseAvailable() {
  return !LOCAL_ONLY_MODE && isFirebaseInitialized;
}

export { db, LOCAL_ONLY_MODE };
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
  limit,
  startAfter
} from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { generateMealId } from './utils.js';

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
  // Validate parameters to prevent errors
  if (!id) {
    console.error("Error updating food item: Missing ID");
    return;
  }

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
  // Use the actual meal timestamp if provided, otherwise use current time
  const mealTime = timestamp || new Date().toISOString();
  
  // Generate a human-readable ID based on the meal timestamp
  const mealId = generateMealId('meal', mealTime);
  
  const submittedMeal = {
    id: mealId,
    items: basketItems,
    timestamp: mealTime,
    submittedAt: new Date().toISOString()
  };

  // In local-only mode, save to memory
  if (LOCAL_ONLY_MODE) {
    localSubmittedMeals.push(submittedMeal);
    console.log("Meal saved locally with readable ID:", mealId);
    return mealId;
  }

  // Save to Firestore if available
  if (!db || !isFirebaseInitialized) {
    console.error("Firestore not initialized yet");
    return null;
  }

  try {
    // Save the submitted meal to a new collection using the human-readable ID
    await setDoc(doc(db, "submitted-meals", mealId), submittedMeal);
    console.log("Meal saved to Firestore with readable ID:", mealId);
    return mealId;
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
 * Get submitted meals with pagination
 * @param {Number} pageSize - Number of meals per page
 * @param {Object|null} lastVisible - The last document from the previous page, null for the first page
 * @returns {Promise<Object>} - Promise that resolves with meals array and the last visible document for pagination
 */
export async function getSubmittedMealsPaginated(pageSize = 10, lastVisible = null) {
  // In local-only mode, return slices of local memory items
  if (LOCAL_ONLY_MODE) {
    // Get starting index based on the last visible document
    let startIndex = 0;
    if (lastVisible && lastVisible.index !== undefined) {
      startIndex = lastVisible.index + 1;
    }
    
    // Get a slice of local meals
    const endIndex = Math.min(startIndex + pageSize, localSubmittedMeals.length);
    const meals = localSubmittedMeals.slice(startIndex, endIndex);
    
    // Calculate if there are more pages
    const hasNextPage = endIndex < localSubmittedMeals.length;
    
    // Create a lastVisible object for the next page
    const newLastVisible = meals.length > 0 ? { 
      index: startIndex + meals.length - 1 
    } : null;
    
    return {
      meals,
      lastVisible: newLastVisible,
      hasNextPage
    };
  }

  if (!db || !isFirebaseInitialized) {
    console.warn("Firestore not initialized yet, returning empty array");
    return { meals: [], lastVisible: null, hasNextPage: false };
  }

  // Create a timeout promise that rejects after specified time
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Firestore operation timed out')), 5000);
  });
  
  try {
    // Build query with pagination
    let mealsQuery;
    
    if (lastVisible) {
      // Continue from the last document (next page)
      mealsQuery = query(
        collection(db, "submitted-meals"),
        orderBy("submittedAt", "desc"),
        limit(pageSize),
        startAfter(lastVisible)
      );
    } else {
      // First page
      mealsQuery = query(
        collection(db, "submitted-meals"),
        orderBy("submittedAt", "desc"),
        limit(pageSize)
      );
    }
    
    // Race between the actual query and the timeout
    const queryPromise = getDocs(mealsQuery);
    const querySnapshot = await Promise.race([queryPromise, timeout]);
    
    // Convert documents to objects
    const meals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get the last visible document for next pagination call
    const newLastVisible = querySnapshot.docs.length > 0 ? 
      querySnapshot.docs[querySnapshot.docs.length - 1] : null;
    
    // Check if there might be more pages
    // We'll need a separate count query to know for sure, but this is a reasonable approximation
    const hasNextPage = querySnapshot.docs.length >= pageSize;
    
    console.log(`Retrieved ${meals.length} submitted meals (paginated) from Firestore`);
    return {
      meals,
      lastVisible: newLastVisible,
      hasNextPage
    };
  } catch (error) {
    console.warn("Error getting paginated meals from Firestore:", error.message);
    // Return empty results instead of throwing to prevent app crashes
    return { meals: [], lastVisible: null, hasNextPage: false };
  }
}

/**
 * Update all submitted meals that contain a specific food item with the updated version
 * @param {string} foodId - The ID of the food item that was updated
 * @param {Object} updatedFood - The updated food item data
 * @returns {Promise<number>} - Promise that resolves with the number of meals updated
 */
export async function updateSubmittedMealsWithFoodItem(foodId, updatedFood) {
  // In local-only mode, update in memory
  if (LOCAL_ONLY_MODE) {
    let updatedCount = 0;
    
    localSubmittedMeals.forEach(meal => {
      if (meal.items && Array.isArray(meal.items)) {
        let mealUpdated = false;
        
        // Look for the food item in the meal items
        meal.items.forEach((item, index) => {
          if (item.id === foodId) {
            // Update food item properties while preserving amount
            const amount = item.amount;
            meal.items[index] = { 
              ...updatedFood,
              amount // Keep the original amount
            };
            mealUpdated = true;
          }
        });
        
        if (mealUpdated) {
          updatedCount++;
        }
      }
    });
    
    console.log(`Updated ${updatedCount} local meals containing food ID: ${foodId}`);
    return updatedCount;
  }

  // Firestore implementation
  if (!db || !isFirebaseInitialized) {
    console.error("Firestore not initialized yet");
    return 0;
  }

  try {
    // Step 1: Query all meals that contain the food item
    const mealsCollection = collection(db, "submitted-meals");
    const mealsSnapshot = await getDocs(mealsCollection);
    
    if (mealsSnapshot.empty) {
      console.log("No submitted meals found");
      return 0;
    }
    
    let updatedCount = 0;
    const updatePromises = [];
    
    // Step 2: For each meal, check if it contains the food item and update if needed
    mealsSnapshot.forEach(mealDoc => {
      const meal = mealDoc.data();
      
      if (meal.items && Array.isArray(meal.items)) {
        let mealNeedsUpdate = false;
        const updatedItems = meal.items.map(item => {
          if (item.id === foodId) {
            mealNeedsUpdate = true;
            // Update food item properties while preserving amount
            return { 
              ...updatedFood,
              amount: item.amount // Keep the original amount
            };
          }
          return item;
        });
        
        // If this meal contains the food item, update it
        if (mealNeedsUpdate) {
          updatePromises.push(
            updateDoc(doc(db, "submitted-meals", mealDoc.id), {
              items: updatedItems
            })
          );
          updatedCount++;
        }
      }
    });
    
    // Step 3: Wait for all updates to complete
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }
    
    console.log(`Updated ${updatedCount} meals in Firestore containing food ID: ${foodId}`);
    return updatedCount;
  } catch (error) {
    console.error("Error updating submitted meals:", error);
    throw error;
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
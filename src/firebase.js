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

// In-memory storage for fallback when Firebase is unavailable
const localFoodItems = [];
const localSubmittedMeals = []; // Add storage for submitted meals

function initializeFirebase() {
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

// Initialize Firebase
initializeFirebase();

// Disable analytics in development environment to avoid errors
let analytics = null;
try {
  if (app) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn('Firebase Analytics failed to initialize:', error);
}

/**
 * Save food item to Firestore with local fallback
 * @param {Object} foodItem - The food item data to save
 * @returns {Promise<string|null>} - Promise that resolves with the document ID or null on error
 */
export async function saveFoodItem(foodItem) {
  // Generate a custom ID based on timestamp
  const customId = foodItem.id || `custom_${Date.now()}`;
  const itemToSave = {
    ...foodItem,
    id: customId,
    firestoreId: customId,
    updatedAt: new Date().toISOString()
  };

  // Save to Firestore if available
  if (db && isFirebaseInitialized) {
    try {
      // Use setDoc with merge to handle both new and existing documents
      await setDoc(doc(db, "food-items", customId), {
        ...foodItem,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log("Food item saved to Firestore with ID:", customId);
      return customId;
    } catch (error) {
      console.error("Error saving food item to Firestore:", error);
      // Fall back to local storage
    }
  }

  // Fallback: Save to local memory if Firestore is unavailable
  const existingIndex = localFoodItems.findIndex(item => item.id === customId);
  if (existingIndex >= 0) {
    localFoodItems[existingIndex] = itemToSave;
  } else {
    localFoodItems.push(itemToSave);
  }
  
  console.log("Food item saved locally with ID:", customId);
  return customId;
}

/**
 * Get all food items from storage
 * @returns {Promise<Array>} - Promise that resolves with an array of food items
 */
export async function getFoodItems() {
  if (!db || !isFirebaseInitialized) {
    console.warn("Firestore not initialized, returning local items");
    return localFoodItems;
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
    // Return local items as fallback when Firebase is unavailable
    console.log("Falling back to local items");
    return localFoodItems;
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

  // Update in Firestore if available
  if (db && isFirebaseInitialized) {
    try {
      const foodRef = doc(db, "food-items", id);
      await updateDoc(foodRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      console.log("Food item updated in Firestore:", id);
      return;
    } catch (error) {
      console.error("Error updating food item in Firestore:", error);
      // Fall back to local storage
    }
  }

  // Fallback: Update in local memory
  const index = localFoodItems.findIndex(item => item.id === id);
  if (index >= 0) {
    localFoodItems[index] = {
      ...localFoodItems[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    console.log("Food item updated locally:", id);
  }
}

/**
 * Delete a food item from storage
 * @param {string} id - The ID of the food item
 */
export async function deleteFoodItem(id) {
  // Try to delete from Firestore first
  if (db && isFirebaseInitialized) {
    try {
      await deleteDoc(doc(db, "food-items", id));
      console.log("Food item deleted from Firestore:", id);
      return;
    } catch (error) {
      console.error("Error deleting food item from Firestore:", error);
      // Fall back to local storage
    }
  }

  // Fallback: Delete from local memory
  const index = localFoodItems.findIndex(item => item.id === id);
  if (index >= 0) {
    localFoodItems.splice(index, 1);
    console.log("Food item deleted locally:", id);
  }
}

/**
 * Save submitted meal to storage
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

  // Try to save to Firestore if available
  if (db && isFirebaseInitialized) {
    try {
      // Save the submitted meal using the human-readable ID
      await setDoc(doc(db, "submitted-meals", mealId), submittedMeal);
      console.log("Meal saved to Firestore with readable ID:", mealId);
      return mealId;
    } catch (error) {
      console.error("Error saving meal to Firestore:", error);
      // Fall back to local storage
    }
  }

  // Fallback: Save to local memory
  localSubmittedMeals.push(submittedMeal);
  console.log("Meal saved locally with readable ID:", mealId);
  return mealId;
}

/**
 * Get submitted meals from storage
 * @param {Number} maxItems - Maximum number of meals to return
 * @returns {Promise<Array>} - Promise that resolves with an array of submitted meals
 */
export async function getSubmittedMeals(maxItems = 100) {
  // Try Firestore first
  if (db && isFirebaseInitialized) {
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
      // Fall back to local meals
    }
  }

  // Fallback: Return local memory items
  console.log("Using local submitted meals");
  return localSubmittedMeals;
}

/**
 * Get submitted meals with pagination
 * @param {Number} pageSize - Number of meals per page
 * @param {Object|null} lastVisible - The last document from the previous page, null for the first page
 * @returns {Promise<Object>} - Promise that resolves with meals array and the last visible document for pagination
 */
export async function getSubmittedMealsPaginated(pageSize = 10, lastVisible = null) {
  // Try Firestore first
  if (db && isFirebaseInitialized) {
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
      const hasNextPage = querySnapshot.docs.length >= pageSize;
      
      console.log(`Retrieved ${meals.length} submitted meals (paginated) from Firestore`);
      return {
        meals,
        lastVisible: newLastVisible,
        hasNextPage
      };
    } catch (error) {
      console.warn("Error getting paginated meals from Firestore:", error.message);
      // Fall back to local pagination
    }
  }

  // Fallback: Return slices of local memory items
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

/**
 * Update all submitted meals that contain a specific food item with the updated version
 * @param {string} foodId - The ID of the food item that was updated
 * @param {Object} updatedFood - The updated food item data
 * @returns {Promise<number>} - Promise that resolves with the number of meals updated
 */
export async function updateSubmittedMealsWithFoodItem(foodId, updatedFood) {
  let updatedCount = 0;
  
  // Try Firestore first
  if (db && isFirebaseInitialized) {
    try {
      // Step 1: Query all meals that contain the food item
      const mealsCollection = collection(db, "submitted-meals");
      const mealsSnapshot = await getDocs(mealsCollection);
      
      if (!mealsSnapshot.empty) {
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
      }
    } catch (error) {
      console.error("Error updating submitted meals in Firestore:", error);
      // Fall back to local update
    }
  }

  // Fallback: Update in local memory
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

/**
 * Update a submitted meal
 * @param {Object} meal - The meal data to update
 * @returns {Promise<string>} - Promise that resolves with the meal ID
 */
export async function updateSubmittedMeal(meal) {
    if (!meal || !meal.id) {
        throw new Error("Invalid meal data: Missing ID");
    }
    
    // Try Firestore first
    if (db && isFirebaseInitialized) {
      try {
        const mealRef = doc(db, "submitted-meals", meal.id);
        
        // Update the meal in Firestore
        await updateDoc(mealRef, {
            items: meal.items,
            // We don't update the timestamp to preserve when it was originally created
            lastUpdated: new Date().toISOString()
        });
        
        console.log(`Updated submitted meal [${meal.id}] in Firestore`);
        return meal.id;
      } catch (error) {
        console.error("Error updating submitted meal in Firestore:", error);
        // Fall back to local update
      }
    }

    // Fallback: Update in local memory
    const index = localSubmittedMeals.findIndex(m => m.id === meal.id);
    if (index >= 0) {
      localSubmittedMeals[index] = {
        ...localSubmittedMeals[index],
        items: meal.items,
        lastUpdated: new Date().toISOString()
      };
      console.log(`Updated submitted meal [${meal.id}] locally`);
      return meal.id;
    }
    
    throw new Error(`Meal with ID ${meal.id} not found`);
}

/**
 * Delete a submitted meal
 * @param {string} mealId - The ID of the meal to delete
 * @returns {Promise<boolean>} - Promise that resolves with true if the meal was deleted
 */
export async function deleteSubmittedMeal(mealId) {
    if (!mealId) {
        throw new Error("Invalid meal ID");
    }
    
    // Try Firestore first
    if (db && isFirebaseInitialized) {
      try {
        const mealRef = doc(db, "submitted-meals", mealId);
        
        // Delete the meal from Firestore
        await deleteDoc(mealRef);
        
        console.log(`Deleted submitted meal [${mealId}] from Firestore`);
        return true;
      } catch (error) {
        console.error("Error deleting submitted meal from Firestore:", error);
        // Fall back to local deletion
      }
    }

    // Fallback: Delete from local memory
    const index = localSubmittedMeals.findIndex(meal => meal.id === mealId);
    if (index >= 0) {
      localSubmittedMeals.splice(index, 1);
      console.log(`Deleted submitted meal [${mealId}] locally`);
      return true;
    }
    
    throw new Error(`Meal with ID ${mealId} not found`);
}

/**
 * Backup all Firestore data into new collections with date prefix
 * @returns {Promise<Object>} - Object containing backup status and details
 */
export async function backupFirestoreData() {
  // Check if Firebase is available
  if (!db || !isFirebaseInitialized) {
    return { 
      success: false, 
      message: "Database not available. Please try again later." 
    };
  }
  
  try {
    // Create a prefix for the backup collections with current date
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const prefix = `backup_${currentDate}`;
    
    // Step 1: Backup food items
    const foodItemsSnapshot = await getDocs(collection(db, "food-items"));
    let foodItemsCount = 0;
    
    for (const docSnapshot of foodItemsSnapshot.docs) {
      await setDoc(
        doc(db, `${prefix}_food-items`, docSnapshot.id),
        docSnapshot.data()
      );
      foodItemsCount++;
    }
    
    // Step 2: Backup submitted meals
    const mealsSnapshot = await getDocs(collection(db, "submitted-meals"));
    let mealsCount = 0;
    
    for (const docSnapshot of mealsSnapshot.docs) {
      await setDoc(
        doc(db, `${prefix}_submitted-meals`, docSnapshot.id),
        docSnapshot.data()
      );
      mealsCount++;
    }
    
    console.log(`Backup completed successfully with prefix: ${prefix}`);
    console.log(`- ${foodItemsCount} food items backed up`);
    console.log(`- ${mealsCount} meals backed up`);
    
    return {
      success: true,
      prefix,
      foodItemsCount,
      mealsCount
    };
  } catch (error) {
    console.error("Error during backup:", error);
    return {
      success: false,
      message: `Backup failed: ${error.message}`
    };
  }
}

/**
 * Check if Firebase is connected and available
 * @returns {boolean} - Whether Firebase is available
 */
export function isFirebaseAvailable() {
  return isFirebaseInitialized;
}

// Export connection state for UI indicators
export const firebaseConnectionState = {
  isConnected: isFirebaseConnected,
  hasError: false,
  errorMessage: ''
};

export { db };
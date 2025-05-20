import { DatabaseService } from './interfaces/DatabaseService.js';
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
import { generateMealId } from '../utils.js';

/**
 * Firebase implementation of the DatabaseService interface
 */
export class FirebaseDatabaseService extends DatabaseService {
  constructor() {
    super();
    
    // Firebase connection state
    this.isFirebaseConnected = false;
    this.isFirebaseInitialized = false;
    
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
    
    // Initialize Firebase with exponential backoff retry
    this.app = null;
    this.db = null;
    this.retries = 0;
    this.MAX_RETRIES = 1;
    
    // In-memory storage for fallback when Firebase is unavailable
    this.localFoodItems = [];
    this.localSubmittedMeals = [];
    
    // Initialize Firebase
    this.initializeFirebase();
    
    // Disable analytics in development environment to avoid errors
    this.analytics = null;
    try {
      if (this.app) {
        this.analytics = getAnalytics(this.app);
      }
    } catch (error) {
      console.warn('Firebase Analytics failed to initialize:', error);
    }
    
    // Export connection state for UI indicators
    this.firebaseConnectionState = {
      isConnected: this.isFirebaseConnected,
      hasError: false,
      errorMessage: ''
    };
    
    // Bind methods to ensure 'this' context is preserved
    this.initializeFirebase = this.initializeFirebase.bind(this);
    this.getFoodItems = this.getFoodItems.bind(this);
    this.saveFoodItem = this.saveFoodItem.bind(this);
    this.updateFoodItem = this.updateFoodItem.bind(this);
    this.deleteFoodItem = this.deleteFoodItem.bind(this);
    this.getSubmittedMealsPaginated = this.getSubmittedMealsPaginated.bind(this);
    this.saveSubmittedMeal = this.saveSubmittedMeal.bind(this);
    this.updateSubmittedMeal = this.updateSubmittedMeal.bind(this);
    this.deleteSubmittedMeal = this.deleteSubmittedMeal.bind(this);
    this.updateSubmittedMealsWithFoodItem = this.updateSubmittedMealsWithFoodItem.bind(this);
    this.backupData = this.backupData.bind(this);
    this.exportCollections = this.exportCollections.bind(this);
    this.isAvailable = this.isAvailable.bind(this);
  }
  
  /**
   * Initialize Firebase with exponential backoff retry
   * @private
   */
  initializeFirebase() {
    try {
      console.log('Initializing Firebase...');
      this.app = initializeApp(this.firebaseConfig);
      this.db = getFirestore(this.app);
      
      console.log('Firebase initialized successfully');
      this.isFirebaseInitialized = true;
      
      return true;
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      this.isFirebaseInitialized = false;
      
      if (this.retries < this.MAX_RETRIES) {
        this.retries++;
        const backoffTime = Math.pow(2, this.retries) * 1000;
        console.log(`Retrying Firebase initialization in ${backoffTime}ms...`);
        
        setTimeout(() => {
          this.initializeFirebase();
        }, backoffTime);
      }
      
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  async getFoodItems() {
    if (!this.db || !this.isFirebaseInitialized) {
      console.warn("Firestore not initialized, returning local items");
      return this.localFoodItems;
    }

    // Create a timeout promise that rejects after specified time
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore operation timed out')), 3000);
    });
    
    try {
      // Race between the actual query and the timeout
      const queryPromise = getDocs(collection(this.db, "food-items"));
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
      return this.localFoodItems;
    }
  }

  /**
   * @inheritdoc
   */
  async saveFoodItem(foodItem) {
    // Generate a custom ID based on timestamp
    const customId = foodItem.id || `custom_${Date.now()}`;
    const itemToSave = {
      ...foodItem,
      id: customId,
      firestoreId: customId,
      updatedAt: new Date().toISOString()
    };

    // Save to Firestore if available
    if (this.db && this.isFirebaseInitialized) {
      try {
        // Use setDoc with merge to handle both new and existing documents
        await setDoc(doc(this.db, "food-items", customId), {
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
    const existingIndex = this.localFoodItems.findIndex(item => item.id === customId);
    if (existingIndex >= 0) {
      this.localFoodItems[existingIndex] = itemToSave;
    } else {
      this.localFoodItems.push(itemToSave);
    }
    
    console.log("Food item saved locally with ID:", customId);
    return customId;
  }

  /**
   * @inheritdoc
   */
  async updateFoodItem(foodItem) {
    const id = foodItem.id;
    
    // Validate parameters to prevent errors
    if (!id) {
      console.error("Error updating food item: Missing ID");
      return;
    }

    // Update in Firestore if available
    if (this.db && this.isFirebaseInitialized) {
      try {
        const foodRef = doc(this.db, "food-items", id);
        await updateDoc(foodRef, {
          ...foodItem,
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
    const index = this.localFoodItems.findIndex(item => item.id === id);
    if (index >= 0) {
      this.localFoodItems[index] = {
        ...this.localFoodItems[index],
        ...foodItem,
        updatedAt: new Date().toISOString()
      };
      console.log("Food item updated locally:", id);
    }
  }

  /**
   * @inheritdoc
   */
  async deleteFoodItem(foodId) {
    // Try to delete from Firestore first
    if (this.db && this.isFirebaseInitialized) {
      try {
        await deleteDoc(doc(this.db, "food-items", foodId));
        console.log("Food item deleted from Firestore:", foodId);
        return;
      } catch (error) {
        console.error("Error deleting food item from Firestore:", error);
        // Fall back to local storage
      }
    }

    // Fallback: Delete from local memory
    const index = this.localFoodItems.findIndex(item => item.id === foodId);
    if (index >= 0) {
      this.localFoodItems.splice(index, 1);
      console.log("Food item deleted locally:", foodId);
    }
  }

  /**
   * @inheritdoc
   */
  async getSubmittedMealsPaginated(pageSize = 10, lastVisible = null) {
    // Try Firestore first
    if (this.db && this.isFirebaseInitialized) {
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
            collection(this.db, "submitted-meals"),
            orderBy("timestamp", "desc"),
            limit(pageSize),
            startAfter(lastVisible)
          );
        } else {
          // First page
          mealsQuery = query(
            collection(this.db, "submitted-meals"),
            orderBy("timestamp", "desc"),
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
    const endIndex = Math.min(startIndex + pageSize, this.localSubmittedMeals.length);
    const meals = this.localSubmittedMeals.slice(startIndex, endIndex);
    
    // Calculate if there are more pages
    const hasNextPage = endIndex < this.localSubmittedMeals.length;
    
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
   * @inheritdoc
   */
  async saveSubmittedMeal(basketItems, timestamp) {
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
    if (this.db && this.isFirebaseInitialized) {
      try {
        // Save the submitted meal using the human-readable ID
        await setDoc(doc(this.db, "submitted-meals", mealId), submittedMeal);
        console.log("Meal saved to Firestore with readable ID:", mealId);
        return mealId;
      } catch (error) {
        console.error("Error saving meal to Firestore:", error);
        // Fall back to local storage
      }
    }

    // Fallback: Save to local memory
    this.localSubmittedMeals.push(submittedMeal);
    console.log("Meal saved locally with readable ID:", mealId);
    return mealId;
  }

  /**
   * @inheritdoc
   */
  async updateSubmittedMeal(meal) {
    if (!meal || !meal.id) {
      throw new Error("Invalid meal data: Missing ID");
    }
    
    // Try Firestore first
    if (this.db && this.isFirebaseInitialized) {
      try {
        const mealRef = doc(this.db, "submitted-meals", meal.id);
        
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
    const index = this.localSubmittedMeals.findIndex(m => m.id === meal.id);
    if (index >= 0) {
      this.localSubmittedMeals[index] = {
        ...this.localSubmittedMeals[index],
        items: meal.items,
        lastUpdated: new Date().toISOString()
      };
      console.log(`Updated submitted meal [${meal.id}] locally`);
      return meal.id;
    }
    
    throw new Error(`Meal with ID ${meal.id} not found`);
  }

  /**
   * @inheritdoc
   */
  async deleteSubmittedMeal(mealId) {
    if (!mealId) {
      throw new Error("Invalid meal ID");
    }
    
    // Try Firestore first
    if (this.db && this.isFirebaseInitialized) {
      try {
        const mealRef = doc(this.db, "submitted-meals", mealId);
        
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
    const index = this.localSubmittedMeals.findIndex(meal => meal.id === mealId);
    if (index >= 0) {
      this.localSubmittedMeals.splice(index, 1);
      console.log(`Deleted submitted meal [${mealId}] locally`);
      return true;
    }
    
    throw new Error(`Meal with ID ${mealId} not found`);
  }

  /**
   * @inheritdoc
   */
  async updateSubmittedMealsWithFoodItem(foodId, updatedFood) {
    let updatedCount = 0;
    
    // Try Firestore first
    if (this.db && this.isFirebaseInitialized) {
      try {
        // Step 1: Query all meals that contain the food item
        const mealsCollection = collection(this.db, "submitted-meals");
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
                  updateDoc(doc(this.db, "submitted-meals", mealDoc.id), {
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
    this.localSubmittedMeals.forEach(meal => {
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
   * @inheritdoc
   */
  async backupData() {
    // Check if Firebase is available
    if (!this.db || !this.isFirebaseInitialized) {
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
      const foodItemsSnapshot = await getDocs(collection(this.db, "food-items"));
      let foodItemsCount = 0;
      
      for (const docSnapshot of foodItemsSnapshot.docs) {
        await setDoc(
          doc(this.db, `${prefix}_food-items`, docSnapshot.id),
          docSnapshot.data()
        );
        foodItemsCount++;
      }
      
      // Step 2: Backup submitted meals
      const mealsSnapshot = await getDocs(collection(this.db, "submitted-meals"));
      let mealsCount = 0;
      
      for (const docSnapshot of mealsSnapshot.docs) {
        await setDoc(
          doc(this.db, `${prefix}_submitted-meals`, docSnapshot.id),
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
   * @inheritdoc
   */
  async exportCollections() {
    let foodItems = [];
    let meals = [];
    
    // Try to get data from Firestore first
    if (this.db && this.isFirebaseInitialized) {
      try {
        // Get all food items
        const foodItemsSnapshot = await getDocs(collection(this.db, "food-items"));
        foodItems = foodItemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Get all submitted meals (no pagination)
        const mealsSnapshot = await getDocs(collection(this.db, "submitted-meals"));
        meals = mealsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`Retrieved ${foodItems.length} food items and ${meals.length} meals for export`);
      } catch (error) {
        console.error("Error fetching data for export:", error);
        // Fall back to local data
      }
    }
    
    // If Firestore failed or isn't available, use local data
    if (foodItems.length === 0) {
      foodItems = [...this.localFoodItems];
    }
    
    if (meals.length === 0) {
      meals = [...this.localSubmittedMeals];
    }
    
    return { foodItems, meals };
  }

  /**
   * @inheritdoc
   */
  isAvailable() {
    return this.isFirebaseInitialized;
  }
}
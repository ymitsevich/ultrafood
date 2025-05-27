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

  /**
   * Migrate categories to tags for all food items
   * This function scans all food items and moves category values to tags array
   * @returns {Object} Migration results with statistics
   */
  async migrateCategoryToTags() {
    if (!this.db) {
      throw new Error('Firebase not initialized');
    }

    try {
      console.log('Starting category to tags migration procedure...');
      
      const foodItemsRef = collection(this.db, 'foodItems');
      const snapshot = await getDocs(foodItemsRef);
      
      let processedCount = 0;
      let updatedCount = 0;
      const batch = writeBatch(this.db);
      
      snapshot.forEach((doc) => {
        const foodId = doc.id;
        const foodItem = doc.data();
        processedCount++;
        
        // Check if the item has a category field and needs updating
        if (foodItem.category && typeof foodItem.category === 'string') {
          // Initialize tags array if it doesn't exist
          let tags = Array.isArray(foodItem.tags) ? [...foodItem.tags] : [];
          
          // Only add category to tags if it's not already present
          if (!tags.includes(foodItem.category)) {
            tags.push(foodItem.category);
            
            // Update the document in the batch
            const docRef = doc.ref;
            batch.update(docRef, {
              tags: tags,
              updatedAt: new Date().toISOString(),
              categoryMigratedAt: new Date().toISOString()
            });
            
            console.log(`Updated food item [${foodId}]: added category "${foodItem.category}" to tags`);
            updatedCount++;
          }
        }
      });
      
      // Commit the batch if there are updates
      if (updatedCount > 0) {
        await batch.commit();
        console.log(`Batch committed: ${updatedCount} food items updated`);
      }
      
      console.log(`Category to tags migration completed: ${updatedCount}/${processedCount} food items updated`);
      
      return {
        success: true,
        processedCount,
        updatedCount
      };
    } catch (error) {
      console.error('Error during category to tags migration:', error);
      throw error;
    }
  }

  /**
   * Migrate categories to tags for food items within submitted meals
   * This function scans all submitted meals and moves category values to tags array for food items
   * @returns {Object} Migration results with statistics
   */
  async migrateMealCategoryToTags() {
    if (!this.db) {
      throw new Error('Firebase not initialized');
    }

    try {
      console.log('Starting meal category to tags migration procedure...');
      
      const mealsRef = collection(this.db, 'submittedMeals');
      const snapshot = await getDocs(mealsRef);
      
      let processedCount = 0;
      let updatedCount = 0;
      const updatePromises = [];
      
      snapshot.forEach((docSnapshot) => {
        const mealId = docSnapshot.id;
        const meal = docSnapshot.data();
        processedCount++;
        
        if (meal.items && Array.isArray(meal.items)) {
          let mealUpdated = false;
          
          // Create updated items array with migrated tags
          const updatedItems = meal.items.map(item => {
            // Check if the item has a category field and needs updating
            if (item.category && typeof item.category === 'string') {
              // Initialize tags array if it doesn't exist
              let tags = Array.isArray(item.tags) ? [...item.tags] : [];
              
              // Only add category to tags if it's not already present
              if (!tags.includes(item.category)) {
                tags.push(item.category);
                mealUpdated = true;
                
                console.log(`Updated food item [${item.id || item.name}] in meal [${mealId}]: added category "${item.category}" to tags`);
              }
              
              return { ...item, tags };
            }
            return item;
          });
          
          // If any items were updated, add the update to promises array
          if (mealUpdated) {
            const updatePromise = updateDoc(doc(this.db, "submitted-meals", mealId), {
              items: updatedItems,
              updatedAt: new Date().toISOString(),
              mealMigratedAt: new Date().toISOString() // Mark when meal migration was performed
            });
            
            updatePromises.push(updatePromise);
            updatedCount++;
          }
        }
      });
      
      // Wait for all updates to complete
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
      
      console.log(`Meal migration procedure completed: ${processedCount} meals processed, ${updatedCount} meals updated`);
      
      return {
        success: true,
        processedCount,
        updatedCount
      };
    } catch (error) {
      console.error("Error during meal migration procedure:", error);
      return {
        success: false,
        processedCount: 0,
        updatedCount: 0,
        message: `Meal migration failed: ${error.message}`
      };
    }
  }

  /**
   * Delete category fields from all food items and submitted meals
   * This function removes the legacy category field from both collections
   * @returns {Promise<{success: boolean, foodItemsProcessed: number, foodItemsUpdated: number, mealsProcessed: number, mealsUpdated: number, message?: string}>}
   */
  async deleteCategoryFields() {
    // Check if Firebase is available
    if (!this.db || !this.isFirebaseInitialized) {
      return { 
        success: false, 
        foodItemsProcessed: 0,
        foodItemsUpdated: 0,
        mealsProcessed: 0,
        mealsUpdated: 0,
        message: "Database not available. Please try again later." 
      };
    }
    
    try {
      console.log('Starting category field deletion procedure...');
      
      let foodItemsProcessed = 0;
      let foodItemsUpdated = 0;
      let mealsProcessed = 0;
      let mealsUpdated = 0;
      
      // Step 1: Delete category fields from food items
      const foodItemsSnapshot = await getDocs(collection(this.db, "food-items"));
      foodItemsProcessed = foodItemsSnapshot.docs.length;
      
      for (const docSnapshot of foodItemsSnapshot.docs) {
        const foodItem = docSnapshot.data();
        const foodId = docSnapshot.id;
        
        // Check if the item has a category field to remove
        if (foodItem.hasOwnProperty('category')) {
          // Create update object with category field removed
          const { category, ...updatedItem } = foodItem;
          
          // Update the food item in Firebase (replace entire document)
          await setDoc(doc(this.db, "food-items", foodId), {
            ...updatedItem,
            updatedAt: new Date().toISOString(),
            categoryDeletedAt: new Date().toISOString() // Mark when category was deleted
          });
          
          foodItemsUpdated++;
          console.log(`Removed category field from food item [${foodId}]`);
        }
      }
      
      // Step 2: Delete category fields from food items within submitted meals
      const mealsSnapshot = await getDocs(collection(this.db, "submitted-meals"));
      mealsProcessed = mealsSnapshot.docs.length;
      
      for (const docSnapshot of mealsSnapshot.docs) {
        const meal = docSnapshot.data();
        const mealId = docSnapshot.id;
        let mealUpdated = false;
        
        // Check if the meal has items array
        if (meal.items && Array.isArray(meal.items)) {
          // Process each food item in the meal
          const updatedItems = meal.items.map(item => {
            // Check if the item has a category field to remove
            if (item.hasOwnProperty('category')) {
              const { category, ...updatedItem } = item;
              mealUpdated = true;
              
              console.log(`Removed category field from food item [${item.id || item.name}] in meal [${mealId}]`);
              
              // Return updated item without category field
              return updatedItem;
            }
            
            // Return item unchanged if no category field
            return item;
          });
          
          // If any items were updated, save the meal back to Firebase
          if (mealUpdated) {
            await updateDoc(doc(this.db, "submitted-meals", mealId), {
              items: updatedItems,
              updatedAt: new Date().toISOString(),
              categoryDeletedAt: new Date().toISOString() // Mark when category deletion was performed
            });
            
            mealsUpdated++;
          }
        }
      }
      
      console.log(`Category deletion procedure completed:`);
      console.log(`- Food items: ${foodItemsProcessed} processed, ${foodItemsUpdated} updated`);
      console.log(`- Meals: ${mealsProcessed} processed, ${mealsUpdated} updated`);
      
      return {
        success: true,
        foodItemsProcessed,
        foodItemsUpdated,
        mealsProcessed,
        mealsUpdated
      };
    } catch (error) {
      console.error("Error during category deletion procedure:", error);
      return {
        success: false,
        foodItemsProcessed: 0,
        foodItemsUpdated: 0,
        mealsProcessed: 0,
        mealsUpdated: 0,
        message: `Category deletion failed: ${error.message}`
      };
    }
  }

  /**
   * Creates a tags collection from all food items
   * Groups all unique tags and creates a tags collection with metadata
   * @returns {Promise<{success: boolean, tagsCreated: number, message?: string}>}
   */
  async createTagsCollection() {
    // Check if Firebase is available
    if (!this.db || !this.isFirebaseInitialized) {
      return { 
        success: false, 
        tagsCreated: 0,
        message: "Database not available. Please try again later." 
      };
    }

    try {
      console.log('Starting tags collection creation...');
      
      // Step 1: Get all food items
      const foodItemsSnapshot = await getDocs(collection(this.db, "food-items"));
      
      // Step 2: Extract and count all tags
      const tagCounts = new Map();
      let totalFoodItems = 0;
      
      for (const docSnapshot of foodItemsSnapshot.docs) {
        const foodItem = docSnapshot.data();
        totalFoodItems++;
        
        // Process tags array if it exists
        if (foodItem.tags && Array.isArray(foodItem.tags)) {
          foodItem.tags.forEach(tag => {
            if (typeof tag === 'string' && tag.trim()) {
              const normalizedTag = tag.trim().toLowerCase();
              tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
            }
          });
        }
      }
      
      // Step 3: Create tags collection documents
      let tagsCreated = 0;
      
      for (const [tagName, count] of tagCounts.entries()) {
        const tagDoc = {
          name: tagName,
          count: count,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        // Use tag name as document ID for easy lookup
        await setDoc(doc(this.db, "tags", tagName), tagDoc);
        tagsCreated++;
        
        console.log(`Created tag document: ${tagName} (count: ${count})`);
      }
      
      console.log(`Tags collection creation completed: ${tagsCreated} unique tags from ${totalFoodItems} food items`);
      
      return {
        success: true,
        tagsCreated,
        totalFoodItems
      };
    } catch (error) {
      console.error("Error during tags collection creation:", error);
      return {
        success: false,
        tagsCreated: 0,
        message: `Tags collection creation failed: ${error.message}`
      };
    }
  }

  /**
   * Retrieves all tags from the tags collection
   * @returns {Promise<Array>} Promise resolving to an array of tag objects with name and count
   */
  async getTags() {
    // Check if Firebase is available
    if (!this.db || !this.isFirebaseInitialized) {
      return [];
    }

    try {
      console.log('Getting tags from tags collection...');
      
      // Get all tag documents from the tags collection
      const tagsSnapshot = await getDocs(collection(this.db, "tags"));
      
      const tags = [];
      tagsSnapshot.docs.forEach(doc => {
        const tagData = doc.data();
        tags.push({
          id: doc.id,
          name: tagData.name || doc.id,
          count: tagData.count || 0,
          createdAt: tagData.createdAt,
          lastUpdated: tagData.lastUpdated
        });
      });
      
      // Sort tags by count (descending) then by name (ascending)
      tags.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.name.localeCompare(b.name);
      });
      
      console.log(`Retrieved ${tags.length} tags from database`);
      return tags;
    } catch (error) {
      console.error("Error getting tags:", error);
      return [];
    }
  }
}
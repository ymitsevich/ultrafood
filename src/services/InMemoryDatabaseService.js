import { DatabaseService } from './interfaces/DatabaseService.js';
import { generateMealId } from '../utils.js';

/**
 * In-memory implementation of the DatabaseService interface
 * This is a simple example to demonstrate how different implementations
 * can adhere to the same contract/interface
 */
export class InMemoryDatabaseService extends DatabaseService {
  constructor() {
    super();
    this.foodItems = [];
    this.meals = [];
  }

  /**
   * @inheritdoc
   */
  async getFoodItems() {
    return [...this.foodItems];
  }

  /**
   * @inheritdoc
   */
  async saveFoodItem(foodItem) {
    const id = foodItem.id || `food_${Date.now()}`;
    const newItem = {
      ...foodItem,
      id,
      updatedAt: new Date().toISOString()
    };
    
    const existingIndex = this.foodItems.findIndex(item => item.id === id);
    if (existingIndex >= 0) {
      this.foodItems[existingIndex] = newItem;
    } else {
      this.foodItems.push(newItem);
    }
    
    return id;
  }

  /**
   * @inheritdoc
   */
  async updateFoodItem(foodItem) {
    const index = this.foodItems.findIndex(item => item.id === foodItem.id);
    if (index >= 0) {
      this.foodItems[index] = {
        ...this.foodItems[index],
        ...foodItem,
        updatedAt: new Date().toISOString()
      };
      return true;
    }
    return false;
  }

  /**
   * @inheritdoc
   */
  async deleteFoodItem(foodId) {
    const index = this.foodItems.findIndex(item => item.id === foodId);
    if (index >= 0) {
      this.foodItems.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * @inheritdoc
   */
  async getSubmittedMealsPaginated(limit, lastVisible) {
    // Sort meals by timestamp in descending order (newest first)
    const sortedMeals = [...this.meals].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Get starting index based on the last visible document
    let startIndex = 0;
    if (lastVisible && lastVisible.index !== undefined) {
      startIndex = lastVisible.index + 1;
    }
    
    // Get a slice of meals
    const endIndex = Math.min(startIndex + limit, sortedMeals.length);
    const meals = sortedMeals.slice(startIndex, endIndex);
    
    // Calculate if there are more pages
    const hasNextPage = endIndex < sortedMeals.length;
    
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
  async saveSubmittedMeal(items, timestamp) {
    const mealId = generateMealId('meal', timestamp || new Date().toISOString());
    
    const meal = {
      id: mealId,
      items: JSON.parse(JSON.stringify(items)), // Deep clone the items
      timestamp: timestamp || new Date().toISOString(),
      submittedAt: new Date().toISOString()
    };
    
    this.meals.push(meal);
    return mealId;
  }

  /**
   * @inheritdoc
   */
  async updateSubmittedMeal(meal) {
    const index = this.meals.findIndex(m => m.id === meal.id);
    if (index >= 0) {
      this.meals[index] = {
        ...this.meals[index],
        items: meal.items,
        lastUpdated: new Date().toISOString()
      };
      return meal.id;
    }
    
    throw new Error(`Meal with ID ${meal.id} not found`);
  }

  /**
   * @inheritdoc
   */
  async deleteSubmittedMeal(mealId) {
    const index = this.meals.findIndex(meal => meal.id === mealId);
    if (index >= 0) {
      this.meals.splice(index, 1);
      return true;
    }
    
    throw new Error(`Meal with ID ${mealId} not found`);
  }

  /**
   * @inheritdoc
   */
  async updateSubmittedMealsWithFoodItem(foodId, updatedFood) {
    let updatedCount = 0;
    
    this.meals.forEach(meal => {
      if (meal.items && Array.isArray(meal.items)) {
        let mealUpdated = false;
        
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
    
    return updatedCount;
  }

  /**
   * @inheritdoc
   */
  async backupData() {
    // In a real implementation, this might save to localStorage or download as JSON
    const backup = {
      foodItems: [...this.foodItems],
      meals: [...this.meals],
      timestamp: new Date().toISOString()
    };
    
    console.log('In-memory backup created:', backup);
    
    return {
      success: true,
      timestamp: backup.timestamp,
      foodItemsCount: this.foodItems.length,
      mealsCount: this.meals.length
    };
  }

  /**
   * @inheritdoc
   */
  isAvailable() {
    return true; // In-memory is always available
  }
}
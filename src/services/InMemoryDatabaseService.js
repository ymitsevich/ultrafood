import { DatabaseService } from './interfaces/DatabaseService.js';
import { generateMealId } from '../utils.js';

/**
 * Default seed data for testing environments
 */
export const DEFAULT_SEED_DATA = {
  foodItems: [
    {
      id: 'apple-test-123456',
      name: 'Apple',
      tags: ['fruits'],
      emoji: '🍎',
      calories: 52,
      image: 'https://res.cloudinary.com/do4lznbge/image/upload/v1746861886/food-images/apple.jpg',
      updatedAt: '2025-01-01T12:00:00.000Z'
    },
    {
      id: 'chicken-breast-test-123457',
      name: 'Chicken Breast',
      tags: ['meat', 'protein'],
      emoji: '🍗',
      calories: 165,
      image: 'https://res.cloudinary.com/do4lznbge/image/upload/v1746861886/food-images/chicken.jpg',
      updatedAt: '2025-01-01T12:00:00.000Z'
    },
    {
      id: 'brown-rice-test-123458',
      name: 'Brown Rice',
      tags: ['grains', 'carbs'],
      emoji: '🍚',
      calories: 112,
      image: 'https://res.cloudinary.com/do4lznbge/image/upload/v1746861886/food-images/rice.jpg',
      updatedAt: '2025-01-01T12:00:00.000Z'
    }
  ],
  meals: [
    {
      id: 'meal_test_1',
      timestamp: '2025-01-01T08:00:00.000Z',
      submittedAt: '2025-01-01T08:05:00.000Z',
      items: [
        {
          id: 'apple-test-123456',
          name: 'Apple',
          tags: ['fruits'],
          calories: 52,
          image: 'https://res.cloudinary.com/do4lznbge/image/upload/v1746861886/food-images/apple.jpg',
          amount: '1'
        },
        {
          id: 'chicken-breast-test-123457',
          name: 'Chicken Breast',
          tags: ['meat', 'protein'],
          calories: 165,
          image: 'https://res.cloudinary.com/do4lznbge/image/upload/v1746861886/food-images/chicken.jpg',
          amount: '100g'
        }
      ]
    }
  ]
};

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
    this.tags = []; // Initialize tags array
    
    // Auto-seed in test environment
    if (process.env.NODE_ENV === 'test') {
      this.seed();
    }
  }

  /**
   * Seed the database with test data
   * @param {Object} seedData - Data to populate the database with
   * @param {Array} seedData.foodItems - Food items to seed
   * @param {Array} seedData.meals - Meals to seed
   * @param {boolean} clearExisting - Whether to clear existing data before seeding
   * @returns {Object} Summary of seeded data
   */
  async seed(seedData = DEFAULT_SEED_DATA, clearExisting = true) {
    if (clearExisting) {
      this.foodItems = [];
      this.meals = [];
      this.tags = [];
    }
    
    if (seedData.foodItems && Array.isArray(seedData.foodItems)) {
      this.foodItems.push(...JSON.parse(JSON.stringify(seedData.foodItems)));
    }
    
    if (seedData.meals && Array.isArray(seedData.meals)) {
      this.meals.push(...JSON.parse(JSON.stringify(seedData.meals)));
    }
    
    // Auto-update tag counts after seeding food items
    if (this.foodItems.length > 0) {
      await this.updateTagCounts();
    }
    
    console.log(`[InMemoryDatabaseService] Seeded with ${this.foodItems.length} food items, ${this.meals.length} meals, and ${this.tags.length} tags`);
    
    return {
      foodItemsCount: this.foodItems.length,
      mealsCount: this.meals.length,
      tagsCount: this.tags.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Clear all data from the database
   * @returns {Object} Summary of cleared data
   */
  clearAll() {
    const summary = {
      foodItemsCount: this.foodItems.length,
      mealsCount: this.meals.length,
      tagsCount: this.tags.length,
      timestamp: new Date().toISOString()
    };
    
    this.foodItems = [];
    this.meals = [];
    this.tags = [];
    
    console.log('[InMemoryDatabaseService] All data cleared');
    return summary;
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
  async exportCollections() {
    return {
      foodItems: [...this.foodItems],
      meals: [...this.meals]
    };
  }

  /**
   * @inheritdoc
   */
  isAvailable() {
    return true; // In-memory is always available
  }

  /**
   * Retrieves all tags from the tags collection
   * @returns {Promise<Array>} Promise resolving to an array of tag objects with name and count
   */
  async getTags() {
    // Initialize tags array if it doesn't exist
    if (!this.tags) {
      this.tags = [];
    }

    try {
      console.log('[InMemory] Getting tags from tags collection...');
      
      // Return a copy of the tags array, sorted by count (descending) then by name (ascending)
      const sortedTags = [...this.tags].sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.name.localeCompare(b.name);
      });
      
      console.log(`[InMemory] Retrieved ${sortedTags.length} tags from collection`);
      return sortedTags;
    } catch (error) {
      console.error('[InMemory] Error getting tags:', error);
      return [];
    }
  }

  /**
   * Updates tag counts in the tags collection based on current food items
   * @returns {Promise<{success: boolean, tagsUpdated: number, message?: string}>}
   */
  async updateTagCounts() {
    try {
      console.log('[InMemory] Starting tag count update...');
      
      // Extract and count all tags
      const tagCounts = new Map();
      let totalFoodItems = this.foodItems.length;
      
      this.foodItems.forEach(foodItem => {
        if (foodItem.tags && Array.isArray(foodItem.tags)) {
          foodItem.tags.forEach(tag => {
            if (typeof tag === 'string' && tag.trim()) {
              const normalizedTag = tag.trim().toLowerCase();
              tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
            }
          });
        }
      });
      
      // Initialize tags array if it doesn't exist
      if (!this.tags) {
        this.tags = [];
      }
      
      // Update or create tags
      let tagsUpdated = 0;
      
      for (const [tagName, count] of tagCounts.entries()) {
        const existingTagIndex = this.tags.findIndex(tag => tag.name === tagName);
        
        const tagDoc = {
          id: tagName,
          name: tagName,
          count: count,
          lastUpdated: new Date().toISOString()
        };
        
        if (existingTagIndex >= 0) {
          // Update existing tag
          this.tags[existingTagIndex] = {
            ...this.tags[existingTagIndex],
            ...tagDoc
          };
        } else {
          // Create new tag
          tagDoc.createdAt = new Date().toISOString();
          this.tags.push(tagDoc);
        }
        
        tagsUpdated++;
        console.log(`[InMemory] Updated tag: ${tagName} (count: ${count})`);
      }
      
      console.log(`[InMemory] Tag count update completed: ${tagsUpdated} tags updated from ${totalFoodItems} food items`);
      
      return {
        success: true,
        tagsUpdated,
        totalFoodItems
      };
    } catch (error) {
      console.error('[InMemory] Error during tag count update:', error);
      return {
        success: false,
        tagsUpdated: 0,
        message: `Tag count update failed: ${error.message}`
      };
    }
  }
}
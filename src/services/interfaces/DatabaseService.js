/**
 * @interface DatabaseService
 * Defines the contract that any database implementation must fulfill.
 */
export class DatabaseService {
  /**
   * Retrieves all food items from the database
   * @returns {Promise<Array>} Promise resolving to an array of food items
   */
  async getFoodItems() {
    throw new Error('Method getFoodItems() must be implemented');
  }

  /**
   * Saves a food item to the database
   * @param {Object} foodItem - The food item to save
   * @returns {Promise<string>} Promise resolving to the ID of the saved food item
   */
  async saveFoodItem(foodItem) {
    throw new Error('Method saveFoodItem() must be implemented');
  }

  /**
   * Updates a food item in the database
   * @param {Object} foodItem - The food item to update
   * @returns {Promise<void>}
   */
  async updateFoodItem(foodItem) {
    throw new Error('Method updateFoodItem() must be implemented');
  }

  /**
   * Deletes a food item from the database
   * @param {string} foodId - The ID of the food item to delete
   * @returns {Promise<void>}
   */
  async deleteFoodItem(foodId) {
    throw new Error('Method deleteFoodItem() must be implemented');
  }

  /**
   * Retrieves submitted meals with pagination
   * @param {number} limit - The number of meals to retrieve
   * @param {Object} lastVisible - The last visible meal for pagination
   * @returns {Promise<Object>} Promise resolving to { meals, lastVisible, hasNextPage }
   */
  async getSubmittedMealsPaginated(limit, lastVisible) {
    throw new Error('Method getSubmittedMealsPaginated() must be implemented');
  }

  /**
   * Saves a submitted meal to the database
   * @param {Array} items - The items in the meal
   * @param {string} timestamp - The timestamp of the meal
   * @returns {Promise<string>} Promise resolving to the ID of the saved meal
   */
  async saveSubmittedMeal(items, timestamp) {
    throw new Error('Method saveSubmittedMeal() must be implemented');
  }

  /**
   * Updates a submitted meal in the database
   * @param {Object} meal - The meal to update
   * @returns {Promise<void>}
   */
  async updateSubmittedMeal(meal) {
    throw new Error('Method updateSubmittedMeal() must be implemented');
  }

  /**
   * Deletes a submitted meal from the database
   * @param {string} mealId - The ID of the meal to delete
   * @returns {Promise<void>}
   */
  async deleteSubmittedMeal(mealId) {
    throw new Error('Method deleteSubmittedMeal() must be implemented');
  }

  /**
   * Updates all submitted meals containing a specific food item
   * @param {string} foodId - The ID of the food item
   * @param {Object} updatedFood - The updated food item
   * @returns {Promise<void>}
   */
  async updateSubmittedMealsWithFoodItem(foodId, updatedFood) {
    throw new Error('Method updateSubmittedMealsWithFoodItem() must be implemented');
  }

  /**
   * Backs up the database data
   * @returns {Promise<Object>} Promise resolving to the result of the backup
   */
  async backupData() {
    throw new Error('Method backupData() must be implemented');
  }

  /**
   * Exports collections as downloadable data
   * @returns {Promise<Object>} Promise resolving to { foodItems, meals }
   */
  async exportCollections() {
    throw new Error('Method exportCollections() must be implemented');
  }

  /**
   * Checks if the database service is available
   * @returns {boolean} True if the database service is available
   */
  isAvailable() {
    throw new Error('Method isAvailable() must be implemented');
  }

  /**
   * Creates a tags collection from all food items
   * Groups all unique tags and creates a tags collection with metadata
   * @returns {Promise<{success: boolean, tagsCreated: number, message?: string}>}
   */
  async createTagsCollection() {
    throw new Error('Method createTagsCollection() must be implemented');
  }

  /**
   * Retrieves all tags from the tags collection
   * @returns {Promise<Array>} Promise resolving to an array of tag objects with name and count
   */
  async getTags() {
    throw new Error('Method getTags() must be implemented');
  }
}
import { DatabaseService } from './interfaces/DatabaseService.js';
import * as firebaseModule from '../firebase.js';

/**
 * Firebase implementation of the DatabaseService interface
 */
export class FirebaseDatabaseService extends DatabaseService {
  /**
   * @inheritdoc
   */
  async getFoodItems() {
    return await firebaseModule.getFoodItems();
  }

  /**
   * @inheritdoc
   */
  async saveFoodItem(foodItem) {
    return await firebaseModule.saveFoodItem(foodItem);
  }

  /**
   * @inheritdoc
   */
  async updateFoodItem(foodItem) {
    return await firebaseModule.updateFoodItem(foodItem.id, foodItem);
  }

  /**
   * @inheritdoc
   */
  async deleteFoodItem(foodId) {
    return await firebaseModule.deleteFoodItem(foodId);
  }

  /**
   * @inheritdoc
   */
  async getSubmittedMealsPaginated(limit, lastVisible) {
    return await firebaseModule.getSubmittedMealsPaginated(limit, lastVisible);
  }

  /**
   * @inheritdoc
   */
  async saveSubmittedMeal(items, timestamp) {
    return await firebaseModule.saveSubmittedMeal(items, timestamp);
  }

  /**
   * @inheritdoc
   */
  async updateSubmittedMeal(meal) {
    return await firebaseModule.updateSubmittedMeal(meal);
  }

  /**
   * @inheritdoc
   */
  async deleteSubmittedMeal(mealId) {
    return await firebaseModule.deleteSubmittedMeal(mealId);
  }

  /**
   * @inheritdoc
   */
  async updateSubmittedMealsWithFoodItem(foodId, updatedFood) {
    return await firebaseModule.updateSubmittedMealsWithFoodItem(foodId, updatedFood);
  }

  /**
   * @inheritdoc
   */
  async backupData() {
    return await firebaseModule.backupFirestoreData();
  }

  /**
   * @inheritdoc
   */
  isAvailable() {
    return firebaseModule.isFirebaseAvailable();
  }
}
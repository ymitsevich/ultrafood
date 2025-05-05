import { writable } from 'svelte/store';
import { updateFoodItem } from '../firebase.js';

// Create a writable store for the food defaults
const foodDefaultsStore = writable({});

// Export food defaults store with helper methods
export const foodDefaults = {
    subscribe: foodDefaultsStore.subscribe,
    
    // Set default amount for a food item
    setDefault: (foodId, amount) => {
        // Validate input parameters
        if (!foodId) {
            console.error("Cannot set default: Missing food ID");
            return;
        }
        
        // Update local store
        foodDefaultsStore.update(defaults => ({
            ...defaults,
            [foodId]: {
                amount,
                lastUsed: new Date().toISOString()
            }
        }));
        
        // Also update the default amount in Firebase
        try {
            updateFoodItem(foodId, { defaultAmount: amount });
            console.log(`Default amount for food ${foodId} updated to ${amount} in Firebase`);
        } catch (error) {
            console.error(`Failed to update default amount in Firebase: ${error}`);
        }
    },
    
    // Get default amount for a food item
    getDefault: (foodId) => {
        let defaults;
        foodDefaultsStore.subscribe(value => {
            defaults = value;
        })();
        
        return defaults[foodId]?.amount || '50g'; // Changed default from 100g to 50g
    }
};
import { writable } from 'svelte/store';

// Create a writable store for the food defaults
const foodDefaultsStore = writable({});

// Export food defaults store with helper methods
export const foodDefaults = {
    subscribe: foodDefaultsStore.subscribe,
    
    // Set default amount for a food item
    setDefault: (foodId, amount) => {
        foodDefaultsStore.update(defaults => ({
            ...defaults,
            [foodId]: {
                amount,
                lastUsed: new Date().toISOString()
            }
        }));
    },
    
    // Get default amount for a food item
    getDefault: (foodId) => {
        let defaults;
        foodDefaultsStore.subscribe(value => {
            defaults = value;
        })();
        
        return defaults[foodId]?.amount || '100g';
    }
};
import { writable } from 'svelte/store';

/**
 * Basket Store
 * Manages the food items in the user's basket
 */

// Create a writable store with empty array initial state
const basketStore = writable([]);

/**
 * Public basket API with methods to manipulate the basket
 */
export const basket = {
    // Allow components to subscribe to basket changes
    subscribe: basketStore.subscribe,
    
    /**
     * Add a food item to the basket
     * @param {Object} item - The food item to add
     */
    add: (item) => {
        if (!item) return;
        
        basketStore.update(items => [
            ...items,
            { ...item } // Create a copy to avoid mutations
        ]);
    },
    
    /**
     * Remove an item from the basket by its index
     * @param {Number} index - The index of the item to remove
     */
    remove: (index) => {
        if (index < 0) return;
        
        basketStore.update(items => 
            items.filter((_, i) => i !== index)
        );
    },
    
    /**
     * Clear all items from the basket
     */
    clear: () => basketStore.set([]),
    
    /**
     * Get the current number of items in the basket
     * @returns {Number} - The count of items in the basket
     */
    count: () => {
        let count;
        basketStore.subscribe(items => {
            count = items.length;
        })();
        return count;
    }
};
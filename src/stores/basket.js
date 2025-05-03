import { writable } from 'svelte/store';

// Create a writable store for the basket
const basketStore = writable([]);

// Create derived functions to manipulate the basket
export const basket = {
    // Subscribe to basket changes
    subscribe: basketStore.subscribe,
    
    // Add an item to the basket
    add: (item) => {
        basketStore.update(items => [
            ...items,
            { ...item }
        ]);
    },
    
    // Remove an item from the basket
    remove: (index) => {
        basketStore.update(items => 
            items.filter((_, i) => i !== index)
        );
    },
    
    // Clear the basket
    clear: () => {
        basketStore.set([]);
    }
};
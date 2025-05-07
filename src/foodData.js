// Export an empty foodDefaults object - all defaults will come from user input
export const foodDefaults = {};

// Function to get initial food data with empty categories
export function getFoodData() {
    return {
        fruit: [],
        vegetables: [],
        proteins: [],
        grains: [],
        dairy: [],
        snacks: [],
        drinks: [],
    };
}

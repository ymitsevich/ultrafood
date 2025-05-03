export const foodDefaults = {
    'chicken': {amount: '150g', lastUsed: '2 days ago'},
    'salad': {amount: '100g', lastUsed: 'yesterday'},
    'pizza': {amount: '1 slice', lastUsed: '3 days ago'},
    'banana': {amount: '1 piece', lastUsed: 'today'},
    'apple': {amount: '1 medium', lastUsed: 'yesterday'},
    'rice': {amount: '200g', lastUsed: 'today'},
    'steak': {amount: '200g', lastUsed: '4 days ago'},
    'fish': {amount: '150g', lastUsed: '5 days ago'},
    'egg': {amount: '2 pieces', lastUsed: 'yesterday'},
    'tofu': {amount: '100g', lastUsed: '2 days ago'},
    'beans': {amount: '150g', lastUsed: '3 days ago'},
    'orange': {amount: '1 medium', lastUsed: 'yesterday'},
    'grapes': {amount: '15 pieces', lastUsed: '2 days ago'},
    'strawberry': {amount: '10 pieces', lastUsed: '4 days ago'},
    'watermelon': {amount: '200g', lastUsed: 'yesterday'},
    'broccoli': {amount: '100g', lastUsed: '2 days ago'},
    'carrot': {amount: '1 medium', lastUsed: 'yesterday'},
    'tomato': {amount: '1 medium', lastUsed: 'today'},
    'potato': {amount: '1 large', lastUsed: '3 days ago'},
    'corn': {amount: '100g', lastUsed: '4 days ago'},
    'bread': {amount: '2 slices', lastUsed: 'today'},
    'noodles': {amount: '150g', lastUsed: '2 days ago'},
    'sandwich': {amount: '1 piece', lastUsed: 'yesterday'},
    'burrito': {amount: '1 piece', lastUsed: '4 days ago'},
    'pasta': {amount: '150g', lastUsed: '2 days ago'},
    'burger': {amount: '1 piece', lastUsed: '5 days ago'},
    'fries': {amount: '100g', lastUsed: '3 days ago'},
    'donut': {amount: '1 piece', lastUsed: '6 days ago'},
    'cake': {amount: '1 slice', lastUsed: '4 days ago'},
    'icecream': {amount: '100g', lastUsed: '3 days ago'},
    'fried_shrimp': {amount: '8 pieces', lastUsed: 'today'},
    'shrimp': {amount: '10 pieces', lastUsed: 'yesterday'},
    'salmon': {amount: '150g', lastUsed: '2 days ago'},
    'crab': {amount: '200g', lastUsed: '1 week ago'},
    'lobster': {amount: '1 piece', lastUsed: '2 weeks ago'},
    'oyster': {amount: '6 pieces', lastUsed: '3 days ago'},
    'squid': {amount: '100g', lastUsed: '1 week ago'}
};

export function getFoodData() {
    return {
        favorites: [
            {id: 'chicken', name: 'Chicken', emoji: '🍗'},
            {id: 'salad', name: 'Salad', emoji: '🥗'},
            {id: 'pizza', name: 'Pizza', emoji: '🍕'},
            {id: 'banana', name: 'Banana', emoji: '🍌'},
            {id: 'apple', name: 'Apple', emoji: '🍎'},
            {id: 'rice', name: 'Rice', emoji: '🍚'},
            {id: 'fried_shrimp', name: 'Fried Shrimp', emoji: '🍤'}
        ],
        protein: [
            {id: 'steak', name: 'Steak', emoji: '🥩'},
            {id: 'chicken', name: 'Chicken', emoji: '🍗'},
            {id: 'fish', name: 'Fish', emoji: '🐟'},
            {id: 'egg', name: 'Eggs', emoji: '🥚'},
            {id: 'tofu', name: 'Tofu', emoji: '🧃'},
            {id: 'beans', name: 'Beans', emoji: '🫘'}
        ],
        fruits: [
            {id: 'apple', name: 'Apple', emoji: '🍎'},
            {id: 'banana', name: 'Banana', emoji: '🍌'},
            {id: 'orange', name: 'Orange', emoji: '🍊'},
            {id: 'grapes', name: 'Grapes', emoji: '🍇'},
            {id: 'strawberry', name: 'Strawberry', emoji: '🍓'},
            {id: 'watermelon', name: 'Watermelon', emoji: '🍉'}
        ],
        vegetables: [
            {id: 'salad', name: 'Salad', emoji: '🥗'},
            {id: 'broccoli', name: 'Broccoli', emoji: '🥦'},
            {id: 'carrot', name: 'Carrot', emoji: '🥕'},
            {id: 'tomato', name: 'Tomato', emoji: '🍅'},
            {id: 'potato', name: 'Potato', emoji: '🥔'},
            {id: 'corn', name: 'Corn', emoji: '🌽'}
        ],
        grains: [
            {id: 'rice', name: 'Rice', emoji: '🍚'},
            {id: 'bread', name: 'Bread', emoji: '🍞'},
            {id: 'noodles', name: 'Noodles', emoji: '🍜'},
            {id: 'sandwich', name: 'Sandwich', emoji: '🥪'},
            {id: 'burrito', name: 'Burrito', emoji: '🌯'},
            {id: 'pasta', name: 'Pasta', emoji: '🍝'}
        ],
        snacks: [
            {id: 'pizza', name: 'Pizza', emoji: '🍕'},
            {id: 'burger', name: 'Burger', emoji: '🍔'},
            {id: 'fries', name: 'Fries', emoji: '🍟'},
            {id: 'donut', name: 'Donut', emoji: '🍩'},
            {id: 'cake', name: 'Cake', emoji: '🍰'},
            {id: 'icecream', name: 'Ice Cream', emoji: '🍦'}
        ],
        seafood: [
            {id: 'fish', name: 'Fish', emoji: '🐟'},
            {id: 'fried_shrimp', name: 'Fried Shrimp', emoji: '🍤'},
            {id: 'shrimp', name: 'Shrimp', emoji: '🦐'},
            {id: 'salmon', name: 'Salmon', emoji: '🐠'},
            {id: 'crab', name: 'Crab', emoji: '🦀'},
            {id: 'lobster', name: 'Lobster', emoji: '🦞'},
            {id: 'oyster', name: 'Oyster', emoji: '🦪'},
            {id: 'squid', name: 'Squid', emoji: '🦑'}
        ]
    };
}

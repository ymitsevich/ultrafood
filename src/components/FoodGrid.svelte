<script>
    import { basket } from '../stores/basket.js';
    import { foodDefaults } from '../stores/foodDefaults.js';
    
    export let category = '';
    export let foodItems = [];
    export let onConfigClick;
    
    function addToBasket(item) {
        basket.add({
            ...item,
            amount: $foodDefaults[item.id]?.amount || '100g'
        });
    }
</script>

<div class="food-grid">
    {#each foodItems as food (food.id)}
        <div class="food-item">
            <button
                class="food-btn"
                on:click={() => addToBasket(food)}
            >
                <div class="food-emoji">{food.emoji}</div>
                <div class="food-name">{food.name}</div>
                <div class="default-amount">{$foodDefaults[food.id]?.amount || '100g'}</div>
            </button>
            <button 
                class="edit-btn" 
                on:click={(e) => {
                    e.stopPropagation();
                    onConfigClick(food);
                }}
            >
                <span class="edit-icon">⚙️</span>
            </button>
        </div>
    {/each}
</div>
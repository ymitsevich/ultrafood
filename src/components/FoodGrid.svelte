<script>
    import { basket } from '../stores/basket.js';
    import { foodDefaults } from '../stores/foodDefaults.js';
    
    export let category = '';
    export let foodItems = [];
    export let onConfigClick;
    export let onAddNewFood; // Add new callback prop
    
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
                {#if food.imageData}
                    <div class="food-image" style="background-image: url('{food.imageData}')"></div>
                {:else}
                    <div class="food-emoji">{food.emoji}</div>
                {/if}
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
    
    <!-- Add New Food Button -->
    <div class="food-item add-new-food">
        <button
            class="food-btn add-food-btn"
            on:click={() => onAddNewFood()}
        >
            <div class="food-emoji add-icon">➕</div>
            <div class="food-name">Add New</div>
        </button>
    </div>
</div>

<style>
    /* Existing styles */
    
    .add-new-food {
        border: 2px dashed #ddd;
        background-color: rgba(255, 255, 255, 0.7);
        transition: all 0.2s;
    }
    
    .add-new-food:hover {
        border-color: #C26C51FF;
        background-color: rgba(255, 255, 255, 0.9);
        transform: translateY(-5px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    }
    
    .add-icon {
        font-size: 80px;
        opacity: 0.8;
        color: #666;
    }
    
    .food-image {
        width: 160px;
        height: 160px;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        border-radius: 12px;
        margin-bottom: 5px;
    }
</style>
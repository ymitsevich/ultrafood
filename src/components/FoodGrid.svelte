<script>
    import { basket } from '../stores/basket.js';
    import { foodDefaults } from '../stores/foodDefaults.js';
    
    // Component props
    export let category = '';
    export let foodItems = [];
    export let onConfigClick;
    export let onAddNewFood;
    
    // Add food item to basket with default amount
    function addToBasket(item) {
        if (!item) return;
        
        const amount = getFoodDefaultAmount(item.id);
        basket.add({ ...item, amount });
    }
    
    // Get default amount for a food item
    function getFoodDefaultAmount(foodId) {
        return $foodDefaults[foodId]?.amount || '100g';
    }
    
    // Handle edit button click with event stopping
    function handleEditClick(e, food) {
        e.stopPropagation();
        onConfigClick(food);
    }
</script>

<div class="food-grid">
    {#each foodItems as food (food.id)}
        <div class="food-item">
            <button class="food-btn" on:click={() => addToBasket(food)}>
                <div class="food-visual">
                    {#if food.imageData}
                        <div class="food-image" style="background-image: url('{food.imageData}')"></div>
                    {:else}
                        <div class="food-emoji">{food.emoji}</div>
                    {/if}
                </div>
                <div class="food-name">{food.name}</div>
                <div class="default-amount">{getFoodDefaultAmount(food.id)}</div>
            </button>
            
            <button class="edit-btn" on:click={(e) => handleEditClick(e, food)}>
                <span class="edit-icon">⚙️</span>
            </button>
        </div>
    {/each}
    
    <!-- Add New Food Button -->
    <div class="food-item add-new-food">
        <button class="food-btn add-food-btn" on:click={onAddNewFood}>
            <div class="food-emoji add-icon">➕</div>
            <div class="food-name">Add New</div>
        </button>
    </div>
</div>

<style>
    .food-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 15px;
        padding: 15px;
    }
    
    .food-item {
        position: relative;
        border-radius: 12px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        background: white;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .food-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
    }
    
    .food-btn {
        width: 100%;
        padding: 15px;
        border: none;
        background: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    
    .food-visual {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .food-emoji {
        font-size: 80px;
        margin-bottom: 5px;
    }
    
    .food-name {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 5px;
    }
    
    .default-amount {
        font-size: 14px;
        color: #666;
    }
    
    .edit-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.8);
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
    }
    
    .edit-btn:hover {
        opacity: 1;
    }
    
    .edit-icon {
        font-size: 16px;
    }
    
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
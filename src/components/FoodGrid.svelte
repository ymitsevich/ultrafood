<script>
    import { basket } from '../stores/basket.js';
    import { foodDefaults } from '../stores/foodDefaults.js';
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    
    // Component props
    export let category = '';
    export let foodItems = [];
    export let onConfigClick;
    export let onAddNewFood;
    
    // Track loading state of images
    let loadingImages = {};
    let addedToBasket = {};
    
    onMount(() => {
        // Initialize loading state for all images
        foodItems.forEach(item => {
            if (item.imageUrl || item.imageData) {
                loadingImages[item.id] = true;
            }
        });
    });
    
    // Handle image load complete
    function imageLoaded(foodId) {
        loadingImages[foodId] = false;
    }
    
    // Add food item to basket with default amount
    function addToBasket(item) {
        if (!item) return;
        
        const amount = getFoodDefaultAmount(item.id);
        basket.add({ ...item, amount });
        
        // Show animation feedback
        addedToBasket[item.id] = true;
        setTimeout(() => {
            addedToBasket[item.id] = false;
        }, 1000);
    }
    
    // Get default amount for a food item
    function getFoodDefaultAmount(foodId) {
        const food = foodItems.find(item => item.id === foodId);
        // First try to get the defaultAmount stored in the food item from Firebase
        // If not found, fall back to the local store with 50g default
        return food?.defaultAmount || $foodDefaults[foodId]?.amount || '50g';
    }
    
    // Handle edit button click with event stopping
    function handleEditClick(e, food) {
        e.stopPropagation();
        onConfigClick(food);
    }
</script>

<div class="food-grid-container">
    <div class="food-grid">
        {#each foodItems as food (food.id)}
            <div class="food-item" class:added-to-basket={addedToBasket[food.id]}>
                <button class="food-btn" on:click={() => addToBasket(food)}>
                    <div class="food-visual">
                        {#if food.imageUrl}
                            {#if loadingImages[food.id]}
                                <div class="loading-placeholder"></div>
                            {/if}
                            <div 
                                class="food-image" 
                                style="background-image: url('{food.imageUrl}')" 
                                class:hidden={loadingImages[food.id]}
                                on:load={() => imageLoaded(food.id)}
                            ></div>
                        {:else if food.imageData}
                            {#if loadingImages[food.id]}
                                <div class="loading-placeholder"></div>
                            {/if}
                            <div 
                                class="food-image" 
                                style="background-image: url('{food.imageData}')" 
                                class:hidden={loadingImages[food.id]}
                                on:load={() => imageLoaded(food.id)}
                            ></div>
                        {:else}
                            <div class="food-emoji">{food.emoji}</div>
                        {/if}
                        
                        {#if addedToBasket[food.id]}
                            <div class="added-indicator" transition:fly={{ y: -20, duration: 300 }}>
                                <span>✓</span>
                            </div>
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
                <div class="add-icon-wrapper">
                    <span class="add-icon">+</span>
                </div>
                <div class="food-name">Add New</div>
            </button>
        </div>
    </div>
</div>

<style>
    /* Add a container to isolate grid styles */
    .food-grid-container {
        width: 100%;
        overflow-x: hidden;
        padding: 0 10px;
    }
    
    .food-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 12px !important;
        padding: 10px 0 !important;
        width: 100% !important;
    }
    
    @media (min-width: 480px) {
        .food-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 15px !important;
        }
    }
    
    @media (min-width: 768px) {
        .food-grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 18px !important;
        }
        
        .food-grid-container {
            padding: 0 15px;
        }
    }
    
    @media (min-width: 1200px) {
        .food-grid {
            grid-template-columns: repeat(5, 1fr) !important;
        }
    }
    
    .food-item {
        position: relative;
        border-radius: 12px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        background: white;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        width: 100%;
        height: auto;
        display: block;
        overflow: hidden;
    }
    
    .food-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
    }
    
    .food-item:active {
        transform: translateY(-2px);
        transition: transform 0.1s;
    }
    
    .added-to-basket {
        animation: pulse 0.8s ease;
    }
    
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(194, 108, 81, 0.7); }
        50% { box-shadow: 0 0 0 10px rgba(194, 108, 81, 0); }
        100% { box-shadow: 0 0 0 0 rgba(194, 108, 81, 0); }
    }
    
    .food-btn {
        width: 100%;
        padding: 12px;
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
        margin-bottom: 8px;
        position: relative;
        width: 80px;
        height: 80px;
    }
    
    .loading-placeholder {
        width: 80px;
        height: 80px;
        background: linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%);
        border-radius: 8px;
        background-size: 200% 100%;
        animation: shimmer 1.5s linear infinite;
    }
    
    @keyframes shimmer {
        0% { background-position: -100% 0; }
        100% { background-position: 100% 0; }
    }
    
    .added-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #4CAF50;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        z-index: 10;
    }
    
    .hidden {
        display: none;
    }
    
    .food-emoji {
        font-size: 50px;
        margin-bottom: 5px;
        transition: transform 0.2s ease-out;
    }
    
    .food-item:hover .food-emoji {
        transform: scale(1.1);
    }
    
    .food-name {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 5px;
        word-break: break-word;
        transition: color 0.2s;
    }
    
    .food-item:hover .food-name {
        color: #C26C51FF;
    }
    
    .default-amount {
        font-size: 13px;
        color: #666;
    }
    
    .edit-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s, transform 0.2s;
        z-index: 5;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    
    .food-item:hover .edit-btn {
        opacity: 0.9;
    }
    
    .edit-btn:hover {
        transform: scale(1.1);
        opacity: 1;
    }
    
    .edit-icon {
        font-size: 14px;
    }
    
    .add-new-food {
        border: 2px dashed #ddd;
        background-color: rgba(255, 255, 255, 0.7);
        transition: all 0.3s;
    }
    
    .add-new-food:hover {
        border-color: #C26C51FF;
        background-color: rgba(255, 255, 255, 0.9);
        transform: translateY(-5px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    }
    
    .add-icon-wrapper {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
        transition: background-color 0.3s, transform 0.3s;
    }
    
    .add-new-food:hover .add-icon-wrapper {
        background-color: #FFE8E0;
        transform: scale(1.05);
    }
    
    .add-icon {
        font-size: 36px;
        font-weight: bold;
        color: #888;
        transition: color 0.3s;
    }
    
    .add-new-food:hover .add-icon {
        color: #C26C51FF;
    }
    
    .food-image {
        width: 80px;
        height: 80px;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        border-radius: 8px;
        margin-bottom: 5px;
        transition: transform 0.3s;
    }
    
    .food-item:hover .food-image {
        transform: scale(1.05);
    }
    
    @media (min-width: 768px) {
        .food-btn {
            padding: 15px;
        }
        
        .food-emoji {
            font-size: 60px;
        }
        
        .food-visual, .food-image, .loading-placeholder {
            width: 90px;
            height: 90px;
        }
    }
    
    /* Touch device optimizations */
    @media (hover: none) {
        .edit-btn {
            opacity: 0.7;
        }
        
        .food-item:hover {
            transform: none;
        }
        
        .food-item:active {
            transform: scale(0.98);
        }
    }
</style>
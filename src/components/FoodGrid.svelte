<script>
    import { basket } from '../stores/basket.js';
    import { foodDefaults } from '../stores/foodDefaults.js';
    import { language, t } from '../stores/language.js';
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    
    // Component props
    export let tag = ''; // Changed from category to tag
    export let foodItems = [];
    export let onConfigClick;
    export let onAddNewFood;
    export let onEditFood;
    export let isVirtualTag = false; // Changed from isVirtualCategory to isVirtualTag
    
    // Track UI state
    let loadingImages = {};
    let addedToBasket = {};
    
    onMount(() => {
        initializeLoadingState();
        preloadImages();
    });
    
    // Initialize loading state for all images
    function initializeLoadingState() {
        foodItems.forEach(item => {
            if (hasImage(item)) {
                loadingImages[item.id] = true;
            }
        });
    }
    
    // Check if food item has image
    function hasImage(item) {
        return item.imageUrl || item.image || item.imageData;
    }
    
    // Get image source for a food item
    function getImageSource(item) {
        return item.imageUrl || item.image || item.imageData;
    }
    
    // Preload images to check if they are already cached
    function preloadImages() {
        foodItems.forEach(item => {
            const imgSrc = getImageSource(item);
            if (!imgSrc) return;
            
            const img = new Image();
            img.onload = () => imageLoaded(item.id);
            img.src = imgSrc;
        });
    }
    
    // Handle image load complete
    function imageLoaded(foodId) {
        loadingImages[foodId] = false;
    }
    
    // Add food item to basket with default amount
    function addToBasket(item) {
        if (!item) return;
        
        const amount = getFoodDefaultAmount(item.id);
        basket.add({ ...item, amount });
        
        showAddedAnimation(item.id);
    }
    
    // Show animation feedback when adding to basket
    function showAddedAnimation(foodId) {
        addedToBasket[foodId] = true;
        setTimeout(() => {
            addedToBasket[foodId] = false;
        }, 1000);
    }
    
    // Get default amount for a food item
    function getFoodDefaultAmount(foodId) {
        const food = foodItems.find(item => item.id === foodId);
        
        // Priority order: 
        // 1. Amount stored in food item from Firebase
        // 2. Amount in local foodDefaults store
        // 3. Default fallback value
        return food?.defaultAmount || 
               $foodDefaults[foodId]?.amount || 
               '50g';
    }
    
    // Handle config button click (adds to basket with default amount)
    function handleConfigClick(e, food) {
        e.stopPropagation();
        addToBasket(food);
    }

    // Handle food button click (opens amount modal)
    function handleFoodClick(food) {
        onConfigClick(food);
    }
    
    // Handle edit button click to open edit modal
    function handleEditClick(e, food) {
        e.stopPropagation();
        if (!onEditFood) return;
        
        onEditFood(food);
    }
</script>

<div class="food-grid-container">
    <div class="food-grid">
        {#each foodItems as food (food.id)}
            <div class="food-item" class:added-to-basket={addedToBasket[food.id]}>
                <button 
                    class="food-btn" 
                    on:click={() => handleFoodClick(food)}
                >
                    <div class="food-visual">
                        {#if hasImage(food)}
                            {#if loadingImages[food.id]}
                                <div class="loading-placeholder"></div>
                            {/if}
                            <div 
                                class="food-image" 
                                style="background-image: url('{getImageSource(food)}')" 
                                class:hidden={loadingImages[food.id]}
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
                    {#if food.calories}
                        <div class="calories">{food.calories} kcal/100g</div>
                    {/if}
                </button>
                
                <!-- Config button (now adds to basket with default amount) -->
                <button class="config-btn" on:click={(e) => handleConfigClick(e, food)}>
                    <span class="icon">🌀</span>
                </button>
                
                <!-- Edit button (added for editing food details) -->
                <button class="edit-btn" on:click={(e) => handleEditClick(e, food)}>
                    <span class="icon">✏️</span>
                </button>
            </div>
        {/each}
        
        <!-- Add New Food Button - Only show for regular tags -->
        {#if !isVirtualTag}
            <div class="food-item add-new-food">
                <button class="food-btn add-food-btn" on:click={onAddNewFood}>
                    <div class="add-icon-wrapper">
                        <span class="add-icon">+</span>
                    </div>
                    <div class="food-name">{t('addNew')}</div>
                </button>
            </div>
        {/if}
    </div>
</div>

<style>
    /* Add a container to isolate grid styles */
    .food-grid-container {
        width: 100%;
        overflow-x: hidden;
        padding: 0;
        box-sizing: border-box;
    }
    
    .food-grid {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 6px !important;
        padding: 6px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        max-width: 100% !important;
        margin: 0 !important;
    }
    
    @media (min-width: 480px) {
        .food-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 10px !important;
            padding: 10px !important;
        }
        
        .food-grid-container {
            padding: 0 10px;
        }
    }
    
    @media (min-width: 768px) {
        .food-grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 15px !important;
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
        border-radius: 10px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        background: white;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        width: 100%;
        height: auto;
        display: block;
        overflow: hidden;
        touch-action: manipulation; /* Improve touch events handling */
    }
    
    .food-btn {
        width: 100%;
        padding: 8px 6px;
        border: none;
        background: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        user-select: none; /* Prevent text selection during long press */
        -webkit-user-select: none;
    }
    
    .food-visual {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 6px;
        position: relative;
        width: 60px;
        height: 60px;
    }
    
    .loading-placeholder {
        width: 60px;
        height: 60px;
        background: linear-gradient(110deg, #ececec 8%, #f5f5f5 18%, #ececec 33%);
        border-radius: 6px;
        background-size: 200% 100%;
        animation: shimmer 1.5s linear infinite;
    }
    
    .food-emoji {
        font-size: 38px;
    }
    
    .food-name {
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 3px;
        word-break: break-word;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    }
    
    .default-amount {
        font-size: 11px;
        color: #666;
    }
    
    .calories {
        font-size: 11px;
        color: #999;
    }
    
    .food-image {
        width: 60px;
        height: 60px;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        border-radius: 6px;
        margin-bottom: 5px;
    }
    
    @media (min-width: 768px) {
        .food-btn {
            padding: 10px 8px;
        }
        
        .food-emoji {
            font-size: 42px;
        }
        
        .food-visual, .food-image, .loading-placeholder {
            width: 70px;
            height: 70px;
        }
        
        .food-name {
            font-size: 14px;
        }
        
        .default-amount {
            font-size: 12px;
        }
        
        .calories {
            font-size: 12px;
        }
    }
    
    /* Button styling */
    .config-btn, .edit-btn {
        position: absolute;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.9);
        border: 1px solid #ddd;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        font-size: 14px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        transition: all 0.2s;
        z-index: 2;
    }
    
    .config-btn {
        top: 5px;
        right: 5px;
    }
    
    .edit-btn {
        top: 5px;
        left: 5px;
    }
    
    .config-btn:hover, .edit-btn:hover {
        transform: scale(1.1);
        background-color: white;
    }
    
    .icon {
        font-size: 14px;
    }
    
    .hidden {
        display: none;
    }
    
    .added-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(76, 175, 80, 0.9);
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
</style>


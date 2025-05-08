<script>
    import { basket } from '../stores/basket.js';
    import { foodDefaults } from '../stores/foodDefaults.js';
    import { language, t } from '../stores/language.js';
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    
    // Component props
    export let category = '';
    export let foodItems = [];
    export let onConfigClick;
    export let onAddNewFood;
    export let onEditFood; // New prop for opening the edit modal
    export let isVirtualCategory = false; // New prop to identify virtual categories like "Recent"
    
    // Track loading state of images
    let loadingImages = {};
    let addedToBasket = {};
    
    // Long press state
    let pressTimer;
    let longPressDuration = 500; // Time in ms to trigger a long press
    let touchStartTime = 0;
    let activeTouchId = null;
    
    onMount(() => {
        // Initialize loading state for all images
        foodItems.forEach(item => {
            if (item.imageUrl || item.image || item.imageData) {
                loadingImages[item.id] = true;
            }
        });
        
        // Pre-load images to avoid loading indicator flashes for cached images
        preloadImages();
    });
    
    // Preload images to check if they are already cached
    function preloadImages() {
        foodItems.forEach(item => {
            if (item.imageUrl || item.image) {
                const imgSrc = item.imageUrl || item.image;
                const img = new Image();
                img.onload = () => imageLoaded(item.id);
                img.src = imgSrc;
            } else if (item.imageData) {
                const img = new Image();
                img.onload = () => imageLoaded(item.id);
                img.src = item.imageData;
            }
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
    
    // Handle context menu (right-click) to open edit modal
    function handleContextMenu(e, food) {
        e.preventDefault(); // Prevent default context menu
        if (onEditFood) {
            onEditFood(food);
        }
        return false;
    }
    
    // Touch event handlers for long press
    function handleTouchStart(e, food) {
        if (activeTouchId !== null) return; // Already processing a touch
        
        activeTouchId = e.targetTouches[0].identifier;
        touchStartTime = Date.now();
        
        // Set a timer for long press
        pressTimer = setTimeout(() => {
            if (onEditFood) {
                onEditFood(food);
            }
            
            // Vibrate if supported
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
        }, longPressDuration);
    }
    
    function handleTouchEnd(e) {
        clearLongPressTimer();
        activeTouchId = null;
    }
    
    function handleTouchMove(e) {
        if (activeTouchId !== null) {
            // Find the touch point that started the gesture
            const touchIdx = Array.from(e.changedTouches).findIndex(
                touch => touch.identifier === activeTouchId
            );
            
            if (touchIdx !== -1) {
                // If moved significantly, cancel the long press
                const touch = e.changedTouches[touchIdx];
                const moveThreshold = 10; // pixels
                
                if (Math.abs(touch.clientX - e.targetTouches[0].clientX) > moveThreshold ||
                    Math.abs(touch.clientY - e.targetTouches[0].clientY) > moveThreshold) {
                    clearLongPressTimer();
                }
            }
        }
    }
    
    function clearLongPressTimer() {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    }
</script>

<div class="food-grid-container">
    <div class="food-grid">
        {#each foodItems as food (food.id)}
            <div class="food-item" class:added-to-basket={addedToBasket[food.id]}>
                <button 
                    class="food-btn" 
                    on:click={() => addToBasket(food)}
                    on:contextmenu={(e) => handleContextMenu(e, food)}
                    on:touchstart={(e) => handleTouchStart(e, food)}
                    on:touchend={handleTouchEnd}
                    on:touchcancel={handleTouchEnd}
                    on:touchmove={handleTouchMove}
                >
                    <div class="food-visual">
                        {#if food.imageUrl || food.image}
                            {#if loadingImages[food.id]}
                                <div class="loading-placeholder"></div>
                            {/if}
                            <div 
                                class="food-image" 
                                style="background-image: url('{food.imageUrl || food.image}')" 
                                class:hidden={loadingImages[food.id]}
                            ></div>
                        {:else if food.imageData}
                            {#if loadingImages[food.id]}
                                <div class="loading-placeholder"></div>
                            {/if}
                            <div 
                                class="food-image" 
                                style="background-image: url('{food.imageData}')" 
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
                </button>
                
                <button class="edit-btn" on:click={(e) => handleEditClick(e, food)}>
                    <span class="edit-icon">⚙️</span>
                </button>
            </div>
        {/each}
        
        <!-- Add New Food Button - Only show for regular categories -->
        {#if !isVirtualCategory}
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
    }
</style>
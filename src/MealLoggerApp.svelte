<script>
    import './styles/main.css';
    import { getFoodData } from './foodData.js';
    import { foodDefaults } from './stores/foodDefaults.js';
    import { basket } from './stores/basket.js';
    import { language, t } from './stores/language.js';
    import { onMount } from 'svelte';
    import { 
        getFoodItems, 
        getSubmittedMeals, 
        getSubmittedMealsPaginated, 
        isFirebaseAvailable, 
        LOCAL_ONLY_MODE,
        updateSubmittedMealsWithFoodItem
    } from './firebase.js';
    
    // Import our components
    import BasketSidebar from './BasketSidebar.svelte';
    import FoodGrid from './components/FoodGrid.svelte';
    import AmountModal from './components/AmountModal.svelte';
    import TimeModal from './components/TimeModal.svelte';
    import AddFoodModal from './components/AddFoodModal.svelte';
    import EditFoodModal from './components/EditFoodModal.svelte';
    import EditMealModal from './components/EditMealModal.svelte';
    import LanguageModal from './components/LanguageModal.svelte';
    import SlideUpMenu from './components/SlideUpMenu.svelte';
    
    // Menu state
    let showMenu = false;
    
    // Food data and category state
    let foodData = getFoodData();
    
    // Recent foods special virtual category
    const RECENT_CATEGORY = "recent";
    let recentFoods = []; // Will store recent foods
    const MAX_RECENT_ITEMS = 20; // Maximum number of recent items to display
    
    // Set recent as default category
    let currentCategory = RECENT_CATEGORY;
    let isLoading = true;
    let loadError = null;
    let usingLocalData = false;

    // New category modal state
    let showAddCategoryModal = false;
    let newCategoryName = '';
    
    // Store for submitted meals
    let submittedMeals = [];
    let isLoadingMeals = false;
    let mealLoadError = null;
    const MEALS_PER_PAGE = 5; // Increased from 3 for better UX
    let showSubmittedMealsModal = false;
    
    // Language modal state
    let showLanguageModal = false;
    
    // Menu items configuration
    let menuItems = [
        {
            icon: '🌐',
            label: () => $language === 'ru' ? 'Настройки языка' : 'Language Settings',
            action: openLanguageModal
        },
        {
            icon: '📋',
            label: () => t('loggedMeals'),
            action: openSubmittedMealsModal
        }
    ];
    
    // Pagination state for server-side pagination
    let lastVisibleMeal = null;
    let hasNextPage = false;
    let currentPage = 1;
    
    // Load food items and submitted meals from Firebase on component mount
    onMount(async () => {
        try {
            isLoading = true;
            loadError = null;
            
            if (LOCAL_ONLY_MODE) {
                console.log('Running in local-only mode - no data will be saved to Firebase');
                usingLocalData = true;
            } else {
                // Get food items from Firebase with timeout
                const firestoreItems = await getFoodItems();
                
                if (firestoreItems && firestoreItems.length > 0) {
                    console.log('Loaded food items from Firebase:', firestoreItems);
                    
                    // Add each item to the appropriate category
                    firestoreItems.forEach(item => {
                        // Skip undefined items or items without id or name
                        if (!item || !item.id || !item.name) {
                            console.warn('Skipping invalid food item:', item);
                            return;
                        }
                        
                        const category = item.category || Object.keys(foodData)[0]; // Default to first category
                        
                        // Create category if it doesn't exist
                        if (!foodData[category]) {
                            foodData[category] = [];
                        }
                        
                        // Add item to category if it's not already there
                        const existingIndex = foodData[category].findIndex(f => f.id === item.id);
                        if (existingIndex >= 0) {
                            // Update existing item
                            foodData[category][existingIndex] = { ...item };
                        } else {
                            // Add new item
                            foodData[category].push(item);
                        }
                    });
                    
                    // Filter out any undefined items that might have slipped in
                    Object.keys(foodData).forEach(category => {
                        foodData[category] = foodData[category].filter(item => item && item.id && item.name);
                    });
                    
                    // Update foodData to trigger reactivity
                    foodData = { ...foodData };
                } else {
                    console.log('No items from Firebase, using default data');
                    usingLocalData = true;
                }
                
                // Load submitted meals and update recent foods
                await loadSubmittedMeals();
                updateRecentFoods();
            }
        } catch (error) {
            console.error('Error loading food items from Firebase:', error);
            loadError = 'Using local data - could not connect to cloud database.';
            usingLocalData = true;
        } finally {
            isLoading = false;
        }
    });
    
    // Toggle menu
    function toggleMenu() {
        showMenu = !showMenu;
    }
    
    // Handle language selector button click
    function openLanguageModal() {
        showLanguageModal = true;
    }
    
    // Load submitted meals from Firebase with pagination
    async function loadSubmittedMeals(resetPagination = true) {
        try {
            isLoadingMeals = true;
            mealLoadError = null;
            
            if (resetPagination) {
                // Reset pagination state when loading first page
                lastVisibleMeal = null;
                submittedMeals = [];
                currentPage = 1;
            }
            
            const result = await getSubmittedMealsPaginated(MEALS_PER_PAGE, lastVisibleMeal);
            
            if (resetPagination) {
                // Replace the meals array with the first page
                submittedMeals = result.meals;
            } else {
                // Append new meals to the existing array
                submittedMeals = [...submittedMeals, ...result.meals];
            }
            
            // Update pagination state
            lastVisibleMeal = result.lastVisible;
            hasNextPage = result.hasNextPage;
            
            console.log(`Loaded page ${currentPage} of meals: ${result.meals.length} items`);
            
            // Update recent foods when meals are loaded
            updateRecentFoods();
        } catch (error) {
            console.error('Error loading submitted meals:', error);
            mealLoadError = 'Failed to load submitted meals.';
        } finally {
            isLoadingMeals = false;
        }
    }
    
    // Extract and update recent foods from submitted meals
    function updateRecentFoods() {
        // Create a map to track unique foods by ID
        const uniqueFoods = new Map();
        
        // Process each meal, most recent first
        submittedMeals.forEach(meal => {
            if (meal.items && Array.isArray(meal.items)) {
                meal.items.forEach(item => {
                    // Only add if not already in the map (keeps most recent instance)
                    if (!uniqueFoods.has(item.id) && item.id && item.name) {
                        uniqueFoods.set(item.id, { ...item });
                    }
                });
            }
        });
        
        // Convert map to array and limit to MAX_RECENT_ITEMS
        recentFoods = Array.from(uniqueFoods.values()).slice(0, MAX_RECENT_ITEMS);
        console.log(`Updated recent foods: ${recentFoods.length} items`);
    }
    
    // Load next page of meals
    async function loadMoreMeals() {
        if (!hasNextPage || isLoadingMeals) return;
        
        currentPage++;
        await loadSubmittedMeals(false); // false means don't reset pagination
    }
    
    // Handle meal submission - refresh data
    function handleMealSubmitted() {
        console.log("Meal submitted, refreshing meal data...");
        loadSubmittedMeals(true); // Reset pagination to show the newest meal
    }
    
    // Modal states
    let showAmountModal = false;
    let showTimeModal = false;
    let showAddFoodModal = false;
    let showEditFoodModal = false; 
    let showEditMealModal = false; // New state for edit meal modal
    let selectedFood = null;
    let editingFood = null; 
    let selectedMeal = null; // Store the meal being edited

    // Variables to manage long press behavior
    let longPressTimer;
    let longPressDuration = 600; // milliseconds
    
    // Function to open the edit meal modal
    function openEditMealModal(meal) {
        // Close the submitted meals modal first
        showSubmittedMealsModal = false;
        
        // Set the selected meal and open the edit modal
        selectedMeal = meal;
        showEditMealModal = true;
    }
    
    // Handle long press start on meal card
    function handleMealCardPress(event, meal) {
        // Clear any existing timer first
        if (longPressTimer) {
            clearTimeout(longPressTimer);
        }
        
        // Start a new timer
        longPressTimer = setTimeout(() => {
            openEditMealModal(meal);
        }, longPressDuration);
        
        // Prevent default behaviors
        event.preventDefault();
    }
    
    // Handle long press end
    function handleMealCardRelease() {
        // Clear the timer
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }
    
    // Handle right-click context menu on meal card (for desktop)
    function handleMealCardContextMenu(event, meal) {
        // Prevent the default context menu
        event.preventDefault();
        event.stopPropagation();
        
        // Clear any existing timer to prevent both long-press and context menu from firing
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        
        // Open the edit meal modal immediately
        console.log('Right-click detected, opening edit modal for meal:', meal.id);
        openEditMealModal(meal);
        
        return false; // Ensure no default context menu appears
    }
    
    // Handle meal save after editing
    function handleSaveEditedMeal(editedMeal) {
        // Find and update the meal in the local array
        const mealIndex = submittedMeals.findIndex(m => m.id === editedMeal.id);
        if (mealIndex >= 0) {
            submittedMeals[mealIndex] = editedMeal;
            submittedMeals = [...submittedMeals]; // Create new reference to trigger reactivity
        }
    }
    
    // Handle meal deletion
    function handleDeleteMeal(mealId) {
        // Remove the meal from the local array
        submittedMeals = submittedMeals.filter(meal => meal.id !== mealId);
    }
    
    function openAmountModal(food) {
        selectedFood = food;
        showAmountModal = true;
    }
    
    function openTimeModal() {
        showTimeModal = true;
    }
    
    function openAddFoodModal() {
        showAddFoodModal = true;
    }
    
    function openEditFoodModal(food) {
        editingFood = food;
        showEditFoodModal = true;
    }
    
    async function handleSaveEditedFood(updatedFood) {
        // Store the original food item before updates for comparison
        const originalFood = { ...editingFood };
        let updatedLocalUI = false;

        // Find the category of the food
        const category = updatedFood.category || currentCategory;
        
        // Make sure the category exists
        if (!foodData[category]) {
            foodData[category] = [];
        }
        
        // Find and update the food item
        const existingIndex = foodData[category].findIndex(item => item.id === updatedFood.id);
        
        if (existingIndex >= 0) {
            // Update existing item in same category
            foodData[category][existingIndex] = { ...updatedFood };
            updatedLocalUI = true;
        } else {
            // If not found in current category (maybe category was changed)
            let foundInOtherCategory = false;
            
            // Look for the item in all categories
            for (const cat of Object.keys(foodData)) {
                if (cat === category) continue; // Already checked current category
                
                const idx = foodData[cat].findIndex(item => item.id === updatedFood.id);
                if (idx >= 0) {
                    // Remove from old category
                    foodData[cat].splice(idx, 1);
                    // Add to new category
                    foodData[category].push(updatedFood);
                    foundInOtherCategory = true;
                    updatedLocalUI = true;
                    break;
                }
            }
            
            // If not found in any category, add it to the specified category
            if (!foundInOtherCategory) {
                foodData[category].push(updatedFood);
                updatedLocalUI = true;
            }
        }
        
        // Update foodData to trigger reactivity if changes were made
        if (updatedLocalUI) {
            foodData = { ...foodData };
        }
        
        // If category changed, switch to the new category
        if (category !== currentCategory) {
            currentCategory = category;
        }
        
        // If not in local-only mode, also update all submitted meals containing this food item
        if (!LOCAL_ONLY_MODE && isFirebaseAvailable()) {
            try {
                // Show loading state or notification
                const updateStatus = document.createElement('div');
                updateStatus.textContent = 'Updating submitted meals...';
                updateStatus.style.position = 'fixed';
                updateStatus.style.bottom = '20px';
                updateStatus.style.left = '50%';
                updateStatus.style.transform = 'translateX(-50%)';
                updateStatus.style.padding = '10px 16px';
                updateStatus.style.borderRadius = '8px';
                updateStatus.style.fontSize = '14px';
                updateStatus.style.backgroundColor = '#e3f2fd';
                updateStatus.style.color = '#0d47a1';
                updateStatus.style.border = '1px solid #bbdefb';
                updateStatus.style.zIndex = '100';
                document.body.appendChild(updateStatus);
                
                // Update all submitted meals in Firebase that contain this food item
                await updateSubmittedMealsWithFoodItem(originalFood.id, updatedFood);
                
                // Refresh the loaded submitted meals to reflect changes
                if (submittedMeals.length > 0) {
                    await loadSubmittedMeals(true);
                }
                
                // Update notification
                updateStatus.textContent = 'Submitted meals updated successfully';
                updateStatus.style.backgroundColor = '#e8f5e9';
                updateStatus.style.color = '#1b5e20';
                updateStatus.style.border = '1px solid #c8e6c9';
                
                // Remove notification after a delay
                setTimeout(() => {
                    document.body.removeChild(updateStatus);
                }, 3000);
                
            } catch (error) {
                console.error('Error updating submitted meals:', error);
                
                // Show error notification
                const errorStatus = document.createElement('div');
                errorStatus.textContent = 'Error updating submitted meals';
                errorStatus.style.position = 'fixed';
                errorStatus.style.bottom = '20px';
                errorStatus.style.left = '50%';
                errorStatus.style.transform = 'translateX(-50%)';
                errorStatus.style.padding = '10px 16px';
                errorStatus.style.borderRadius = '8px';
                errorStatus.style.fontSize = '14px';
                errorStatus.style.backgroundColor = '#ffebee';
                errorStatus.style.color = '#c62828';
                errorStatus.style.border = '1px solid #ffcdd2';
                errorStatus.style.zIndex = '100';
                document.body.appendChild(errorStatus);
                
                // Remove error notification after a delay
                setTimeout(() => {
                    document.body.removeChild(errorStatus);
                }, 5000);
            }
        }
    }
    
    function handleDeleteFood(foodId) {
        // Find the food in all categories and remove it
        for (const category of Object.keys(foodData)) {
            const indexToRemove = foodData[category].findIndex(item => item.id === foodId);
            if (indexToRemove >= 0) {
                // Remove the item
                foodData[category].splice(indexToRemove, 1);
                
                // If the category is now empty, remove it
                if (foodData[category].length === 0) {
                    delete foodData[category];
                    
                    // If we removed the current category, switch to another one
                    if (category === currentCategory) {
                        // Find first non-empty category, or default to the first one
                        const remainingCategories = Object.keys(foodData);
                        if (remainingCategories.length > 0) {
                            currentCategory = remainingCategories[0];
                        }
                    }
                }
                
                // Update foodData to trigger reactivity
                foodData = { ...foodData };
                break;
            }
        }
    }
    
    function openSubmittedMealsModal() {
        showSubmittedMealsModal = true;
        
        // If we haven't loaded any meals yet, load the first page
        if (submittedMeals.length === 0) {
            loadSubmittedMeals(true);
        }
    }
    
    function closeSubmittedMealsModal() {
        showSubmittedMealsModal = false;
    }
    
    // Format date for display
    function formatDate(isoString) {
        try {
            const date = new Date(isoString);
            return date.toLocaleString();
        } catch (e) {
            return isoString;
        }
    }
    
    function handleAddNewFood(newFood) {
        // Add the new food to the current category
        if (!foodData[currentCategory]) {
            foodData[currentCategory] = [];
        }
        
        // Add new food to the current category
        foodData[currentCategory] = [...foodData[currentCategory], newFood];
        
        // Create a new reference for the entire foodData object to trigger reactivity
        foodData = { ...foodData };
    }

    // Add new category function
    function addNewCategory() {
        if (newCategoryName.trim()) {
            // Convert to lowercase and replace spaces with underscores for consistency
            const categoryKey = newCategoryName.trim().toLowerCase().replace(/\s+/g, '_');
            
            // Check if category already exists
            if (!foodData[categoryKey]) {
                // Create the new category with an empty array
                foodData[categoryKey] = [];
                
                // Trigger reactivity by creating a new reference
                foodData = { ...foodData };
                
                // Switch to the new category
                currentCategory = categoryKey;
            }
            
            // Reset and close modal
            newCategoryName = '';
            showAddCategoryModal = false;
        }
    }
</script>

<div class="meal-logger">
    <BasketSidebar 
        onSubmitBasket={openTimeModal}
        onMealSubmitted={handleMealSubmitted} 
    />

    <div class="main-content">
        <!-- Categories -->
        <div class="categories">
            <!-- Always show Recent category first -->
            <button
                class="category-btn {currentCategory === RECENT_CATEGORY ? 'active' : ''}"
                on:click={() => currentCategory = RECENT_CATEGORY}
            >
                {t('recent')}
            </button>
            
            <!-- Show all regular categories with items -->
            {#each Object.entries(foodData).filter(([cat, items]) => items.length > 0 && cat !== RECENT_CATEGORY) as [category, _]}
                <button
                    class="category-btn {currentCategory === category ? 'active' : ''}"
                    on:click={() => currentCategory = category}
                >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
            {/each}
            <!-- Add Category Button -->
            <button
                class="category-btn add-category-btn"
                on:click={() => showAddCategoryModal = true}
                title={t('addCategory')}
            >
                +
            </button>
        </div>

        <!-- Local mode banner -->
        {#if LOCAL_ONLY_MODE}
            <div class="local-mode-banner">
                <p>
                    <strong>{t('localModeActive')}</strong>
                    <span class="hint">{t('cloudStorageHint')}</span>
                </p>
            </div>
        {/if}

        <!-- Loading state -->
        {#if isLoading}
            <div class="loading-state">
                <p>{t('loading')}</p>
            </div>
        {:else}
            <!-- Food Grid Component - Handle Recent Virtual Category Separately -->
            <FoodGrid 
                category={currentCategory}
                foodItems={currentCategory === RECENT_CATEGORY ? recentFoods : (foodData[currentCategory] || [])}
                onConfigClick={openAmountModal}
                onAddNewFood={openAddFoodModal}
                onEditFood={openEditFoodModal}
                isVirtualCategory={currentCategory === RECENT_CATEGORY}
            />
            
            <!-- Show status message if error occurred -->
            {#if !LOCAL_ONLY_MODE && (usingLocalData || loadError)}
                <div class="status-message {loadError ? 'error' : 'info'}">
                    <p>
                        {loadError || t('localModeActive')}
                    </p>
                </div>
            {/if}
        {/if}
    </div>

    <!-- Hamburger Menu Button (top right) -->
    <button class="menu-button" on:click={toggleMenu} title={t('menu')}>
        <div class="hamburger">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </button>
    
    <!-- Slide-up Menu -->
    <SlideUpMenu 
        bind:showMenu={showMenu} 
        menuItems={menuItems.map(item => ({
            ...item,
            label: typeof item.label === 'function' ? item.label() : item.label
        }))}
    />

    <!-- Modals -->
    <AmountModal bind:showModal={showAmountModal} bind:selectedFood={selectedFood} />
    <TimeModal 
        bind:showModal={showTimeModal} 
        onMealSubmitted={handleMealSubmitted} 
    />
    <AddFoodModal 
        bind:showModal={showAddFoodModal} 
        currentCategory={currentCategory === RECENT_CATEGORY ? Object.keys(foodData)[0] || '' : currentCategory}
        onAddFood={handleAddNewFood} 
    />
    <!-- Edit Food Modal -->
    <EditFoodModal 
        bind:showModal={showEditFoodModal}
        foodItem={editingFood}
        onSave={handleSaveEditedFood}
        onDelete={handleDeleteFood}
        categories={Object.keys(foodData).filter(cat => cat !== RECENT_CATEGORY)}
    />
    <!-- Edit Meal Modal -->
    <EditMealModal 
        bind:showModal={showEditMealModal}
        meal={selectedMeal}
        onSave={handleSaveEditedMeal}
        onDelete={handleDeleteMeal}
    />
    <!-- Language Modal -->
    <LanguageModal bind:showModal={showLanguageModal} />
    
    <!-- Submitted Meals Modal -->
    {#if showSubmittedMealsModal}
        <div class="modal">
            <div class="modal-content submitted-meals-modal">
                <span class="close-modal" on:click={closeSubmittedMealsModal}>&times;</span>
                <h2>{t('loggedMeals')}</h2>
                
                {#if isLoadingMeals && submittedMeals.length === 0}
                    <div class="loading-meals">
                        <p>{t('loading')}</p>
                    </div>
                {:else if mealLoadError && submittedMeals.length === 0}
                    <div class="error-message">
                        <p>{t('errorLoadingMeals')}</p>
                    </div>
                {:else if submittedMeals.length === 0}
                    <div class="no-meals-message">
                        <p>{t('noMeals')}</p>
                    </div>
                {:else}
                    <div class="submitted-meals-list">
                        {#each submittedMeals as meal (meal.id)}
                            <div class="meal-card"
                                on:mousedown={e => handleMealCardPress(e, meal)}
                                on:mouseup={handleMealCardRelease}
                                on:mouseleave={handleMealCardRelease}
                                on:touchstart={e => handleMealCardPress(e, meal)}
                                on:touchend={handleMealCardRelease}
                                on:touchcancel={handleMealCardRelease}
                                on:contextmenu={e => handleMealCardContextMenu(e, meal)}
                            >
                                <div class="meal-header">
                                    <div class="meal-timestamp">{formatDate(meal.timestamp)}</div>
                                    <button 
                                        class="edit-meal-button" 
                                        on:click|stopPropagation={() => openEditMealModal(meal)}
                                        aria-label={t('editMeal')}
                                    >
                                        ✏️
                                    </button>
                                </div>
                                <div class="meal-items">
                                    {#each meal.items as item}
                                        <div class="meal-item">
                                            <div class="meal-item-visual">
                                                {#if item.imageUrl || item.image}
                                                    <img src={item.imageUrl || item.image} alt={item.name} class="meal-item-image" />
                                                {:else if item.imageData}
                                                    <img src={item.imageData} alt={item.name} class="meal-item-image" />
                                                {:else}
                                                    <span class="meal-item-emoji">{item.emoji}</span>
                                                {/if}
                                            </div>
                                            <div class="meal-item-details">
                                                <span class="meal-item-name">{item.name}</span>
                                                <span class="meal-item-amount">{item.amount}</span>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                        
                        {#if isLoadingMeals && submittedMeals.length > 0}
                            <div class="loading-more">
                                <div class="loading-spinner"></div>
                                <p>{t('loading')}</p>
                            </div>
                        {/if}
                    </div>
                    
                    <div class="pagination-controls">
                        {#if hasNextPage}
                            <button class="load-more-button" on:click={loadMoreMeals} disabled={isLoadingMeals}>
                                {isLoadingMeals ? t('loading') : t('loadMore')}
                            </button>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    {/if}
    
    <!-- Add Category Modal -->
    {#if showAddCategoryModal}
        <div class="modal">
            <div class="modal-content add-category-modal">
                <span class="close-modal" on:click={() => showAddCategoryModal = false}>&times;</span>
                <h2>{t('addCategory')}</h2>
                
                <div class="form-group">
                    <label for="category-name">{t('categoryName')}</label>
                    <input 
                        type="text" 
                        id="category-name" 
                        bind:value={newCategoryName} 
                        placeholder={t('enterCategoryName')}
                    >
                </div>
                
                <div class="form-actions">
                    <button class="cancel-btn" on:click={() => showAddCategoryModal = false}>{t('cancel')}</button>
                    <button class="save-btn" on:click={addNewCategory} disabled={!newCategoryName.trim()}>
                        {t('addCategory')}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Main container */
    .meal-logger {
        display: flex;
        height: 100vh;
        overflow: hidden;
        width: 100%;
    }
    
    /* Main content area to properly contain the food grid */
    .main-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        width: 100%;
        position: relative;
        box-sizing: border-box;
        padding: 0;
        margin: 0;
        border-left: none;
    }
    
    /* Menu button - positioned in bottom-right corner */
    .menu-button {
        position: fixed;
        bottom: 15px;
        right: 15px;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background-color: white;
        border: 1px solid #ddd;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 90;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .menu-button:hover {
        background-color: #f5f5f5;
        transform: scale(1.05);
    }
    
    .menu-button:active {
        transform: scale(0.95);
    }
    
    .hamburger {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: 20px;
        height: 14px;
    }
    
    .hamburger span {
        height: 2px;
        width: 100%;
        background-color: #555;
        border-radius: 2px;
        transition: all 0.3s;
    }
    
    /* Local mode banner */
    .local-mode-banner {
        background-color: #fff3e0;
        color: #e65100;
        padding: 10px 15px;
        margin: 10px;
        border-radius: 8px;
        border: 1px solid #ffcc80;
        font-size: 14px;
    }
    
    .local-mode-banner .hint {
        font-size: 12px;
        display: block;
        margin-top: 3px;
        color: #bf360c;
    }
    
    /* Categories */
    .categories {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        white-space: nowrap;
        padding: 6px 3px;
        background-color: #f8f8f8;
        border-bottom: 1px solid #e0e0e0;
        gap: 2px;
    }
    
    .category-btn {
        padding: 5px 10px;
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 18px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
        margin: 0;
    }
    
    .category-btn:hover {
        background-color: #f5f5f5;
    }
    
    .category-btn.active {
        background-color: #C26C51;
        color: white;
        border-color: #C26C51;
    }
    
    .add-category-btn {
        font-weight: bold;
        font-size: 16px;
        padding: 8px 14px;
        color: #7E7E7E;
    }
    
    /* Loading state */
    .loading-state {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 300px;
        color: #888;
    }
    
    /* Status messages */
    .status-message {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 5;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .status-message.info {
        background-color: #e3f2fd;
        color: #0d47a1;
        border: 1px solid #bbdefb;
    }
    
    .status-message.error {
        background-color: #ffebee;
        color: #c62828;
        border: 1px solid #ffcdd2;
    }
    
    /* Modal */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: white;
        padding: 20px;
        border-radius: 12px;
        max-width: 90%;
        max-height: 90%;
        overflow-y: auto;
        position: relative;
    }
    
    .close-modal {
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 24px;
        cursor: pointer;
        color: #999;
    }
    
    .close-modal:hover {
        color: #333;
    }
    
    /* Add Category Modal */
    .add-category-modal {
        width: 400px;
        max-width: 90vw;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
    }
    
    .form-group input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 16px;
    }
    
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    
    .cancel-btn, .save-btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        border: none;
    }
    
    .cancel-btn {
        background-color: #f5f5f5;
    }
    
    .save-btn {
        background-color: #C26C51;
        color: white;
    }
    
    .save-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
    
    /* Submitted Meals Modal */
    .submitted-meals-modal {
        width: 600px;
        max-width: 90vw;
        max-height: 80vh;
    }
    
    .submitted-meals-list {
        max-height: 60vh;
        overflow-y: auto;
        padding: 10px 0;
    }
    
    .meal-card {
        border: 1px solid #eee;
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 15px;
        background-color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        position: relative;
    }
    
    .meal-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .meal-timestamp {
        font-weight: 500;
        color: #555;
        font-size: 14px;
    }
    
    .edit-meal-button {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: 0 5px;
    }
    
    .meal-items {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
    
    .meal-item {
        display: flex;
        align-items: center;
        width: calc(50% - 10px);
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        padding: 8px;
        background-color: #fafafa;
    }
    
    .meal-item-visual {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        margin-right: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .meal-item-emoji {
        font-size: 24px;
    }
    
    .meal-item-image {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 5px;
    }
    
    .meal-item-details {
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .meal-item-name {
        font-weight: 500;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .meal-item-amount {
        font-size: 12px;
        color: #777;
    }
    
    .no-meals-message, .error-message, .loading-meals, .loading-more {
        text-align: center;
        padding: 20px;
        color: #777;
    }
    
    .error-message {
        color: #e53935;
    }
    
    .loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #C26C51;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .pagination-controls {
        display: flex;
        justify-content: center;
        margin-top: 20px;
    }
    
    .load-more-button {
        background-color: #f0f0f0;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }
    
    .load-more-button:hover {
        background-color: #e0e0e0;
    }
    
    .load-more-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (max-width: 600px) {
        .meal-item {
            width: 100%;
        }
    }
</style>

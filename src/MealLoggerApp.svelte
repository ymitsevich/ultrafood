<script>
    import './styles/main.css';
    import { getFoodData } from './foodData.js';
    import { foodDefaults } from './stores/foodDefaults.js';
    import { basket } from './stores/basket.js';
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
    
    // Food data and category state
    let foodData = getFoodData();
    let currentCategory = Object.keys(foodData)[0] || '';
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
                
                // Load submitted meals
                loadSubmittedMeals();
            }
        } catch (error) {
            console.error('Error loading food items from Firebase:', error);
            loadError = 'Using local data - could not connect to cloud database.';
            usingLocalData = true;
        } finally {
            isLoading = false;
        }
    });
    
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
        } catch (error) {
            console.error('Error loading submitted meals:', error);
            mealLoadError = 'Failed to load submitted meals.';
        } finally {
            isLoadingMeals = false;
        }
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
    let showEditFoodModal = false; // New state for edit modal
    let selectedFood = null;
    let editingFood = null; // Food item being edited
    
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
        <!-- View submitted foods button -->
        <button 
            class="submitted-foods-button"
            on:click={openSubmittedMealsModal}
            title="View Logged Meals"
        >
            📋
        </button>
        
        <!-- Categories -->
        <div class="categories">
            {#each Object.keys(foodData) as category}
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
                title="Add New Category"
            >
                +
            </button>
        </div>

        <!-- Local mode banner -->
        {#if LOCAL_ONLY_MODE}
            <div class="local-mode-banner">
                <p>
                    <strong>Local Mode:</strong> Changes will not be saved to the cloud. 
                    <span class="hint">To enable cloud storage: create a Firestore database and set LOCAL_ONLY_MODE=false in firebase.js</span>
                </p>
            </div>
        {/if}

        <!-- Loading state -->
        {#if isLoading}
            <div class="loading-state">
                <p>Loading your food items...</p>
            </div>
        {:else}
            <!-- Food Grid Component -->
            <FoodGrid 
                category={currentCategory} 
                foodItems={foodData[currentCategory] || []} 
                onConfigClick={openAmountModal}
                onAddNewFood={openAddFoodModal}
                onEditFood={openEditFoodModal}
            />
            
            <!-- Show status message if error occurred -->
            {#if !LOCAL_ONLY_MODE && (usingLocalData || loadError)}
                <div class="status-message {loadError ? 'error' : 'info'}">
                    <p>
                        {loadError || 'Using local data - changes will not be saved to the cloud.'}
                    </p>
                </div>
            {/if}
        {/if}
    </div>

    <!-- Modals -->
    <AmountModal bind:showModal={showAmountModal} bind:selectedFood={selectedFood} />
    <TimeModal 
        bind:showModal={showTimeModal} 
        onMealSubmitted={handleMealSubmitted} 
    />
    <AddFoodModal 
        bind:showModal={showAddFoodModal} 
        currentCategory={currentCategory}
        onAddFood={handleAddNewFood} 
    />
    <!-- Edit Food Modal -->
    <EditFoodModal 
        bind:showModal={showEditFoodModal}
        foodItem={editingFood}
        onSave={handleSaveEditedFood}
        onDelete={handleDeleteFood}
        categories={Object.keys(foodData)}
    />
    
    <!-- Submitted Meals Modal -->
    {#if showSubmittedMealsModal}
        <div class="modal">
            <div class="modal-content submitted-meals-modal">
                <span class="close-modal" on:click={closeSubmittedMealsModal}>&times;</span>
                <h2>Your Logged Meals</h2>
                
                {#if isLoadingMeals && submittedMeals.length === 0}
                    <div class="loading-meals">
                        <p>Loading your logged meals...</p>
                    </div>
                {:else if mealLoadError && submittedMeals.length === 0}
                    <div class="error-message">
                        <p>{mealLoadError}</p>
                    </div>
                {:else if submittedMeals.length === 0}
                    <div class="no-meals-message">
                        <p>You haven't logged any meals yet. Add items to your basket and submit them to log a meal.</p>
                    </div>
                {:else}
                    <div class="submitted-meals-list">
                        {#each submittedMeals as meal (meal.id)}
                            <div class="meal-card">
                                <div class="meal-header">
                                    <div class="meal-timestamp">{formatDate(meal.timestamp)}</div>
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
                                <p>Loading more meals...</p>
                            </div>
                        {/if}
                    </div>
                    
                    <div class="pagination-controls">
                        {#if hasNextPage}
                            <button class="pagination-button load-more-button" on:click={loadMoreMeals} disabled={isLoadingMeals}>
                                {#if isLoadingMeals}
                                    Loading...
                                {:else}
                                    Load More Meals
                                {/if}
                            </button>
                        {:else}
                            <div class="end-of-results">
                                {submittedMeals.length > 0 ? 'No more meals to load' : ''}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Add Category Modal -->
    {#if showAddCategoryModal}
        <div class="modal" on:click|self={() => showAddCategoryModal = false}>
            <div class="modal-content add-category-modal" on:click|stopPropagation>
                <span class="close-modal" on:click={() => showAddCategoryModal = false}>&times;</span>
                <h2>Add New Category</h2>
                
                <div class="form-group">
                    <label for="category-name">Category Name:</label>
                    <input 
                        type="text" 
                        id="category-name" 
                        placeholder="Enter category name..." 
                        bind:value={newCategoryName}
                        on:keypress={(e) => e.key === 'Enter' && addNewCategory()}
                        autofocus
                    />
                </div>
                
                <button 
                    class="add-category-submit-btn" 
                    on:click={addNewCategory} 
                    disabled={!newCategoryName.trim()}
                >
                    Add Category
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .meal-logger {
        display: flex;
        height: 100vh;
        overflow: hidden;
        gap: 15px; /* Add consistent gap */
    }
    
    .main-content {
        flex: 1;
        padding: 15px 20px 20px;
        overflow-y: auto;
        position: relative;
        margin-left: 0; /* Reset margin since we're using gap */
        width: auto; /* Let flex handle the width */
    }
    
    .categories {
        display: flex;
        flex-wrap: nowrap;
        gap: 0px; /* Reduced from 2px to 0px */
        margin-bottom: 20px;
        overflow-x: auto;
        padding-bottom: 10px; /* Add padding to show scrollbar clearly */
        -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
        scrollbar-width: thin; /* For Firefox */
        white-space: nowrap;
    }
    
    /* Style the scrollbar for webkit browsers */
    .categories::-webkit-scrollbar {
        height: 4px;
    }
    
    .categories::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
    }
    
    .categories::-webkit-scrollbar-thumb {
        background: #C26C51FF;
        border-radius: 10px;
    }
    
    .category-btn {
        padding: 4px 8px; /* Further reduced padding from 6px 10px */
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 20px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
        flex-shrink: 0; /* Prevent button from shrinking */
        margin-right: 1px; /* Add minimal margin instead of gap */
    }
    
    .category-btn.active {
        background-color: #C26C51FF;
        color: white;
        border-color: #C26C51FF;
    }
    
    .category-btn:hover:not(.active) {
        background-color: #e0e0e0;
    }
    
    /* Add category button specific styles */
    .add-category-btn {
        font-size: 18px;
        font-weight: bold;
        padding: 2px 10px;
        width: calc(2em + 20px); /* Make button 2x wider than default */
        background-color: #f8f8f8;
        border: 1px dashed #ccc;
    }
    
    .add-category-btn:hover {
        background-color: #e6e6e6;
        border-color: #C26C51FF;
    }
    
    /* Add category modal specific styles */
    .add-category-modal {
        max-width: 400px;
        padding: 25px;
    }
    
    .add-category-submit-btn {
        background-color: #C26C51FF;
        color: white;
        padding: 12px 20px;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
        display: block;
        width: 100%;
        margin-top: 20px;
    }
    
    .add-category-submit-btn:hover:not([disabled]) {
        background-color: #b05a42;
    }
    
    .add-category-submit-btn[disabled] {
        background-color: #e0bfb5;
        cursor: not-allowed;
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
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 16px;
    }
    
    .loading-state {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
        font-size: 18px;
    }
    
    .local-mode-banner {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeeba;
        border-radius: 4px;
        padding: 10px 16px;
        margin: 10px 0;
        font-size: 14px;
        width: 100%;
    }
    
    .local-mode-banner .hint {
        font-size: 12px;
        opacity: 0.8;
    }
    
    .status-message {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 100;
        opacity: 0.9;
        animation: fadeOut 5s forwards;
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
    
    @keyframes fadeOut {
        0% { opacity: 0.9; }
        70% { opacity: 0.9; }
        100% { opacity: 0; visibility: hidden; }
    }
    
    /* Submitted Foods Button */
    .submitted-foods-button {
        position: fixed;
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #C26C51FF;
        color: white;
        border: none;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10;
        transition: transform 0.2s, background-color 0.2s;
    }
    
    .submitted-foods-button:hover {
        background-color: #a35a42;
        transform: scale(1.05);
    }
    
    /* Modal Styles */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal-content {
        background-color: white;
        width: 90%;
        max-width: 800px;
        border-radius: 20px;
        padding: 30px;
        position: relative;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .close-modal {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 32px;
        cursor: pointer;
        color: #666;
    }
    
    .close-modal:hover {
        color: #333;
    }
    
    h2 {
        margin-bottom: 25px;
        font-size: 28px;
        text-align: center;
    }
    
    /* Submitted Meals Styles */
    .submitted-meals-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }
    
    .meal-card {
        background-color: #f9f9f9;
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s;
    }
    
    .meal-card:hover {
        transform: translateY(-3px);
    }
    
    .meal-header {
        display: flex;
        justify-content: space-between;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
        margin-bottom: 15px;
    }
    
    .meal-timestamp {
        font-weight: bold;
        color: #555;
    }
    
    .meal-items {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
    
    .meal-item {
        display: flex;
        align-items: center;
        background: white;
        border-radius: 8px;
        padding: 8px;
        width: calc(50% - 5px);
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    
    @media (max-width: 600px) {
        .meal-item {
            width: 100%;
        }
    }
    
    .meal-item-visual {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
        overflow: hidden;
        border-radius: 4px;
    }
    
    .meal-item-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .meal-item-emoji {
        font-size: 22px;
    }
    
    .meal-item-details {
        display: flex;
        flex-direction: column;
    }
    
    .meal-item-name {
        font-weight: 500;
        font-size: 14px;
    }
    
    .meal-item-amount {
        font-size: 12px;
        color: #666;
    }
    
    .no-meals-message {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }
    
    .loading-meals {
        text-align: center;
        padding: 40px;
    }
    
    .error-message {
        text-align: center;
        padding: 20px;
        color: #e74c3c;
    }
    
    /* Pagination Controls - updated for "Load More" pattern */
    .pagination-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #eee;
    }
    
    .load-more-button {
        padding: 12px 20px;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 20px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
        min-width: 180px;
    }
    
    .load-more-button:hover:not([disabled]) {
        background-color: #C26C51FF;
        color: white;
    }
    
    .load-more-button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .end-of-results {
        font-size: 14px;
        color: #999;
        padding: 10px;
    }
    
    .loading-more {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 15px;
        color: #666;
        gap: 10px;
    }
    
    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #C26C51FF;
        animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
</style>

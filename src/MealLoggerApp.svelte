<script>
    import './styles/main.css';
    // import { getFoodData } from './foodData.js'; - Removed this import
    import { foodDefaults } from './stores/foodDefaults.js';
    import { basket } from './stores/basket.js';
    import { language, t, i18n } from './stores/language.js';
    import { onMount, setContext } from 'svelte';
    import { fly } from 'svelte/transition'; // Import the fly transition
    
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
    import DailyExportModal from './components/DailyExportModal.svelte';
    import BackdatingModal from './components/BackdatingModal.svelte';
    
    // Accept services from dependency injection container
    export let services;
    
    // Extract services from the props using new generic names
    const { database, imageHosting, imageSearch, auth } = services;
    
    // Make services available to all child components via context
    setContext('services', services);
    
    // Menu state
    let showMenu = false;
    
    // Food data organized by tags only
    let foodData = {}; // Will be populated with tag-based organization
    
    // Recent foods special virtual tag
    const RECENT_TAG = "recent";
    let recentFoods = []; // Will store recent foods
    
    // Current tag state - using tags from database
    let currentTag = RECENT_TAG;
    let availableTags = []; // Will store tags from database
    let isLoadingTags = false;
    let tagLoadError = null;
    
    // Loading and error states
    let isLoading = true;
    let loadError = null;
    let usingLocalData = false;
    
    // Maximum number of recent items to display
    const MAX_RECENT_ITEMS = 40;
    
    // Add tag modal state
    let showAddTagModal = false;
    let newTagName = '';
    
    // Store for submitted meals
    let submittedMeals = [];
    let isLoadingMeals = false;
    let mealLoadError = null;
    const MEALS_PER_PAGE = 20;
    let showSubmittedMealsModal = false;
    
    // Language modal state
    let showLanguageModal = false;
    
    // Daily export modal state
    let showDailyExportModal = false;
    
    // Backdating modal state
    let showBackdatingModal = false;
    
    // Backup state
    let isBackingUp = false;
    let backupResult = null;
    let showBackupModal = false;
    
    // Authentication state
    let currentUser = null;
    let isAuthLoading = false;
    
    // Menu items configuration - reactive based on auth state
    $: menuItems = [
        {
            icon: '🌐',
            label: () => $i18n('languageSettings'),
            action: openLanguageModal
        },
        {
            type: 'divider'
        },
        // Authentication item - login or logout based on auth state
        {
            icon: currentUser ? '👤' : '🔐',
            label: () => currentUser ? $i18n('logout') : $i18n('loginWithGoogle'),
            action: currentUser ? handleLogout : handleLogin
        },
        {
            type: 'divider'
        },
        {
            icon: '📋',
            label: () => $i18n('loggedMeals'),
            action: openSubmittedMealsModal
        },
        {
            type: 'divider'
        },
        {
            icon: '💾',
            label: () => $i18n('dataBackup'),
            action: backupData
        },
        {
            icon: '⬇️',
            label: () => $i18n('exportData'),
            action: exportData
        },
        {
            icon: '📅',
            label: () => $i18n('dailyMealExport'),
            action: openDailyExportModal
        },
        {
            type: 'divider'
        },
        {
            icon: '🔄',
            label: () => $i18n('backdateProcedure'),
            action: openBackdatingModal
        }
    ];
    
    // Pagination state for server-side pagination
    let lastVisibleMeal = null;
    let hasNextPage = false;
    let currentPage = 1;
    
    // Load food items and submitted meals from database on component mount
    onMount(async () => {
        // Set up authentication state listener first
        if (auth.isAvailable()) {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                currentUser = user;
                console.log('Auth state changed:', user ? 'authenticated' : 'not authenticated');
                
                // Load data when authentication state changes
                await loadDataBasedOnAuthState();
            });
            
            // Clean up on component destroy
            return () => {
                unsubscribe();
                window.removeEventListener('foodDataRefresh', handleFoodDataRefresh);
            };
        } else {
            // If auth service is not available, still load data
            await loadDataBasedOnAuthState();
        }
        
        // Listen for food data refresh events from the backdating modal
        window.addEventListener('foodDataRefresh', handleFoodDataRefresh);
    });

    // Load data based on authentication state
    async function loadDataBasedOnAuthState() {
        try {
            isLoading = true;
            loadError = null;
            
            // Reset data first
            foodData = {};
            availableTags = [];
            submittedMeals = [];
            recentFoods = [];
            
            // Only load data if user is authenticated
            if (currentUser) {
                console.log('User authenticated, loading data from database...');
                
                // Load tags from database first
                await loadTags();
                
                // Get food items from database
                const foodItems = await database.getFoodItems();
                
                if (foodItems && foodItems.length > 0) {
                    console.log('Loaded food items from database:', foodItems);
                    
                    // Organize food items by tags
                    organizeFoodByTags(foodItems);
                } else {
                    console.log('No items from database');
                }
                
                // Load submitted meals and update recent foods
                await loadSubmittedMeals();
                updateRecentFoods();
                
                usingLocalData = false;
                loadError = null;
            } else {
                console.log('User not authenticated, showing empty state');
                // Show empty state for non-authenticated users
                loadError = null;
                usingLocalData = false;
            }
        } catch (error) {
            console.error('Error loading data:', error);
            if (currentUser) {
                loadError = 'Failed to load data from database.';
            }
        } finally {
            isLoading = false;
        }
    }

    // Organize food items by their tags
    function organizeFoodByTags(foodItems) {
        // Reset food data
        foodData = {};
        
        foodItems.forEach(item => {
            if (!item || !item.id || !item.name) {
                console.warn('Skipping invalid food item:', item);
                return;
            }
            
            // Handle items with tags
            if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
                item.tags.forEach(tag => {
                    if (!foodData[tag]) {
                        foodData[tag] = [];
                    }
                    
                    // Add item to tag group if not already there
                    const existingIndex = foodData[tag].findIndex(f => f.id === item.id);
                    if (existingIndex < 0) {
                        foodData[tag].push(item);
                    }
                });
            } else {
                // Items without tags - create an "untagged" group
                const untaggedGroup = 'untagged';
                if (!foodData[untaggedGroup]) {
                    foodData[untaggedGroup] = [];
                }
                foodData[untaggedGroup].push(item);
            }
        });
        
        // Filter out any undefined items
        Object.keys(foodData).forEach(tag => {
            foodData[tag] = foodData[tag].filter(item => item && item.id && item.name);
        });
        
        // Update foodData to trigger reactivity
        foodData = { ...foodData };
    }

    // Load tags from database
    async function loadTags() {
        try {
            isLoadingTags = true;
            tagLoadError = null;
            
            console.log('Loading tags from database...');
            const tags = await database.getTags();
            
            if (tags && tags.length > 0) {
                availableTags = tags;
                console.log(`Loaded ${tags.length} tags from database`);
            } else {
                console.log('No tags found in database');
                availableTags = [];
            }
        } catch (error) {
            console.error('Error loading tags from database:', error);
            tagLoadError = 'Failed to load tags from database';
            availableTags = [];
        } finally {
            isLoadingTags = false;
        }
    }

    // Get food items for a specific tag
    function getFoodItemsForTag(tagName) {
        return foodData[tagName] || [];
    }
    
    // Toggle menu
    function toggleMenu() {
        showMenu = !showMenu;
    }
    
    // Handle language selector button click
    function openLanguageModal() {
        showLanguageModal = true;
    }
    
    // Handle daily export modal
    function openDailyExportModal() {
        showDailyExportModal = true;
    }
    
    // Handle backdating modal
    function openBackdatingModal() {
        showBackdatingModal = true;
    }
    
    // Load submitted meals from database with pagination
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
            
            const result = await database.getSubmittedMealsPaginated(MEALS_PER_PAGE, lastVisibleMeal);
            
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
        const uniqueFoods = new Map();
        
        submittedMeals.forEach(meal => {
            if (meal.items && Array.isArray(meal.items)) {
                meal.items.forEach(item => {
                    if (!uniqueFoods.has(item.id) && item.id && item.name) {
                        uniqueFoods.set(item.id, { ...item });
                    }
                });
            }
        });
        
        recentFoods = Array.from(uniqueFoods.values()).slice(0, MAX_RECENT_ITEMS);
        console.log(`Updated recent foods: ${recentFoods.length} items`);
    }
    
    // Load next page of meals
    async function loadMoreMeals() {
        if (!hasNextPage || isLoadingMeals) return;
        
        currentPage++;
        await loadSubmittedMeals(false);
    }
    
    // Notification system
    let notification = null;
    let notificationTimeout = null;
    
    // Show a notification message
    function showNotification(message, type = 'success') {
        // Clear any existing notification timeout
        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
        }
        
        // Set the notification
        notification = { message, type };
        
        // Auto-hide after 3 seconds
        notificationTimeout = setTimeout(() => {
            notification = null;
        }, 3000);
    }
    
    // Handle meal submission - refresh data
    function handleMealSubmitted() {
        console.log("Meal submitted, refreshing meal data...");
        
        // Show a success notification
        showNotification('Meal logged successfully!');
        
        // Refresh meal data
        loadSubmittedMeals(true); // Reset pagination to show the newest meal
    }
    // Function to backup database data
    async function backupData() {
        if (!database.isAvailable()) {
            alert($i18n('localModeActive'));
            return;
        }
        
        showBackupModal = true;
        isBackingUp = true;
        backupResult = null;
        
        try {
            // Call the backup function
            backupResult = await database.backupData();
            console.log('Backup completed:', backupResult);
        } catch (error) {
            console.error('Error during backup:', error);
            backupResult = {
                success: false,
                message: error.message
            };
        } finally {
            isBackingUp = false;
        }
    }
    
    // Modal states
    let showAmountModal = false;
    let showTimeModal = false;
    let showAddFoodModal = false;
    let showEditFoodModal = false; 
    let showEditMealModal = false;
    let selectedFood = null;
    let editingFood = null; 
    let selectedMeal = null; // Store the meal being edited
    
    // Function to open the edit meal modal
    function openEditMealModal(meal) {
        // Close the submitted meals modal first
        showSubmittedMealsModal = false;
        
        // Set the selected meal and open the edit modal
        selectedMeal = meal;
        showEditMealModal = true;
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
    
    // Handle add new tag
    async function addNewTag() {
        if (!newTagName.trim()) {
            showNotification(t('tagNameRequired'), 'error');
            return;
        }

        try {
            isLoadingTags = true;
            
            // Create a minimal food item to establish the tag
            const tagFood = {
                name: `${newTagName} Tag Food`,
                tags: [newTagName.toLowerCase().trim()],
                emoji: '🏷️'
            };

            await database.addFood(tagFood);
            
            // Refresh tags and switch to the new tag
            await loadTags();
            currentTag = newTagName.toLowerCase().trim();
            
            // Reset modal state
            showAddTagModal = false;
            newTagName = '';
            
            showNotification(t('tagAdded'), 'success');
        } catch (error) {
            console.error('Error adding tag:', error);
            showNotification(t('errorAddingTag'), 'error');
        } finally {
            isLoadingTags = false;
        }
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
    
    // Function to export data
    async function exportData() {
        if (!database.isAvailable()) {
            alert($i18n('localModeActive'));
            return;
        }
        
        try {
            // Show loading notification
            showNotification($i18n('exportingData'));
            
            // Get all data to export
            const { foodItems, meals } = await database.exportCollections();
            
            // Create a single combined JSON file for download with both collections
            const combinedData = {
                foodItems: foodItems || [],
                submittedMeals: meals || []
            };
            
            // Generate timestamp for the filename
            const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            
            if ((foodItems && foodItems.length > 0) || (meals && meals.length > 0)) {
                // Download the combined data as a single file
                downloadJsonFile(
                    combinedData, 
                    `meal-logger-export-${timestamp}.json`
                );
                
                // Show success notification
                showNotification(
                    $i18n('importSuccessful') + ` (${foodItems?.length || 0} ${$i18n('foodItemsImported')}, ${meals?.length || 0} ${$i18n('mealsImported')})`
                );
            } else {
                showNotification(
                    $i18n('importFailed'), 
                    'error'
                );
            }
        } catch (error) {
            console.error('Error during export:', error);
            showNotification($i18n('errorExporting'), 'error');
        }
    }
    
    // Helper function to download data as a JSON file
    function downloadJsonFile(data, filename) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Append to the document, click it to trigger download, then remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
    
    // Function to open the submitted meals modal
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
    
    function handleAddNewFood(newFood) {
        // Add the food to all its tag groups
        if (newFood.tags && Array.isArray(newFood.tags) && newFood.tags.length > 0) {
            newFood.tags.forEach(tag => {
                if (!foodData[tag]) {
                    foodData[tag] = [];
                }
                
                const existingIndex = foodData[tag].findIndex(item => item.id === newFood.id);
                if (existingIndex < 0) {
                    foodData[tag].push(newFood);
                }
            });
        } else {
            // Items without tags go to "untagged"
            const untaggedGroup = 'untagged';
            if (!foodData[untaggedGroup]) {
                foodData[untaggedGroup] = [];
            }
            foodData[untaggedGroup].push(newFood);
        }
        
        // Create a new reference for reactivity
        foodData = { ...foodData };
    }
    
    async function handleSaveEditedFood(updatedFood) {
        const originalFood = { ...editingFood };
        let updatedLocalUI = false;
        
        // Clear food from all tag groups first
        for (const tag of Object.keys(foodData)) {
            const itemIndex = foodData[tag].findIndex(item => item.id === updatedFood.id);
            if (itemIndex >= 0) {
                foodData[tag].splice(itemIndex, 1);
                // Remove empty tag groups
                if (foodData[tag].length === 0) {
                    delete foodData[tag];
                }
                updatedLocalUI = true;
            }
        }
        
        // Add the food to all its new tag groups
        if (updatedFood.tags && Array.isArray(updatedFood.tags) && updatedFood.tags.length > 0) {
            updatedFood.tags.forEach(tag => {
                if (!foodData[tag]) {
                    foodData[tag] = [];
                }
                foodData[tag].push(updatedFood);
                updatedLocalUI = true;
            });
        } else {
            // Items without tags go to "untagged"
            const untaggedGroup = 'untagged';
            if (!foodData[untaggedGroup]) {
                foodData[untaggedGroup] = [];
            }
            foodData[untaggedGroup].push(updatedFood);
            updatedLocalUI = true;
        }
        
        // If current tag was deleted, switch to Recent or first available tag
        if (!foodData[currentTag] && currentTag !== RECENT_TAG) {
            const availableTagNames = Object.keys(foodData);
            currentTag = availableTagNames.length > 0 ? availableTagNames[0] : RECENT_TAG;
        }

        // Update foodData to trigger reactivity if changes were made
        if (updatedLocalUI) {
            foodData = { ...foodData };
        }
        
        // Update submitted meals if in cloud mode
        if (database.isAvailable()) {
            try {
                await database.updateSubmittedMealsWithFoodItem(originalFood.id, updatedFood);
                
                if (submittedMeals.length > 0) {
                    await loadSubmittedMeals(true);
                }
                
                showNotification('Food item and submitted meals updated successfully');
            } catch (error) {
                console.error('Error updating submitted meals:', error);
                showNotification('Error updating submitted meals', 'error');
            }
        }
    }
    
    function handleDeleteFood(foodId) {
        // Find the food in all tag groups and remove it
        for (const tag of Object.keys(foodData)) {
            const indexToRemove = foodData[tag].findIndex(item => item.id === foodId);
            if (indexToRemove >= 0) {
                foodData[tag].splice(indexToRemove, 1);
                
                // If the tag group is now empty, remove it
                if (foodData[tag].length === 0) {
                    delete foodData[tag];
                    
                    // If we removed the current tag, switch to another one
                    if (tag === currentTag) {
                        const remainingTags = Object.keys(foodData);
                        currentTag = remainingTags.length > 0 ? remainingTags[0] : RECENT_TAG;
                    }
                }
                
                // Update foodData to trigger reactivity
                foodData = { ...foodData };
            }
        }
    }
    
    // Helper function to reload food data
    async function loadFoodData() {
        try {
            const foodItems = await database.getFoodItems();
            
            if (foodItems && foodItems.length > 0) {
                organizeFoodByTags(foodItems);
            }
        } catch (error) {
            console.error('Error reloading food data:', error);
        }
    }

    // Handle food data refresh events from backdating modal
    async function handleFoodDataRefresh() {
        console.log('Food data refresh event received, reloading data...');
        
        try {
            await loadFoodData();
            await loadTags();
            showNotification('Food data refreshed successfully!');
        } catch (error) {
            console.error('Error refreshing food data:', error);
            showNotification('Failed to refresh food data', 'error');
        }
    }
    
    // Authentication functions
    async function handleLogin() {
        if (!auth.isAvailable()) {
            showNotification($i18n('authRequired'), 'error');
            return;
        }
        
        try {
            isAuthLoading = true;
            const user = await auth.signInWithGoogle();
            
            if (user) {
                currentUser = user;
                showNotification($i18n('welcomeUser', { name: user.displayName || user.email }), 'success');
            }
        } catch (error) {
            console.error('Login error:', error);
            showNotification($i18n('loginFailed'), 'error');
        } finally {
            isAuthLoading = false;
        }
    }
    
    async function handleLogout() {
        if (!auth.isAvailable()) {
            return;
        }
        
        try {
            isAuthLoading = true;
            await auth.signOut();
            currentUser = null;
            showNotification($i18n('logoutSuccess'), 'success');
        } catch (error) {
            console.error('Logout error:', error);
            showNotification($i18n('logoutFailed'), 'error');
        } finally {
            isAuthLoading = false;
        }
    }
    
    // Set up authentication state listener on mount
    onMount(() => {
        if (auth.isAvailable()) {
            // Set up auth state listener
            const unsubscribe = auth.onAuthStateChanged((user) => {
                currentUser = user;
                if (user && !isAuthLoading) {
                    console.log('User authenticated:', user);
                }
            });
            
            // Clean up on component destroy
            return unsubscribe;
        }
    });
</script>

<div class="meal-logger">
    <BasketSidebar 
        onSubmitBasket={openTimeModal}
        onMealSubmitted={handleMealSubmitted} 
        {showNotification}
    />

    <div class="main-content">
        <!-- Tags -->
        <div class="tags">
            <!-- Always show Recent tag first -->
            <button
                class="tag-btn {currentTag === RECENT_TAG ? 'active' : ''}"
                on:click={() => currentTag = RECENT_TAG}
            >
                {t('recent')}
            </button>
            
            <!-- Tag separator -->
            <div class="tag-separator"></div>
            
            <!-- Show tags from database -->
            {#if isLoadingTags}
                <div class="loading-tags">
                    <span class="tag-btn loading">{t('loading')}</span>
                </div>
            {:else if tagLoadError}
                <div class="tags-error">
                    <span class="tag-btn error-tag">{t('errorLoadingTags')}</span>
                </div>
            {:else if availableTags.length > 0}
                {#each availableTags as tag}
                    <button
                        class="tag-btn {currentTag === tag.name ? 'active' : ''}"
                        on:click={() => currentTag = tag.name}
                        title="{tag.name} ({tag.count} items)"
                    >
                        {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                    </button>
                {/each}
            {:else if currentUser}
                <!-- Authenticated user with no tags available -->
                <div class="no-tags-message">
                    <span>{t('noTagsAvailable')}</span>
                </div>
            {/if}
            
            <!-- Add Tag Button -->
            <button
                class="tag-btn add-tag-btn"
                on:click={() => showAddTagModal = true}
                title={t('addTag')}
            >
                +
            </button>
        </div>

        <!-- Loading state -->
        {#if isLoading}
            <div class="loading-state">
                <p>{t('loading')}</p>
            </div>
        {:else if currentUser}
            <!-- Authenticated user - show FoodGrid -->
            <FoodGrid
                tag={currentTag}
                foodItems={currentTag === RECENT_TAG ? recentFoods : 
                          (availableTags.some(tag => tag.name === currentTag) ? 
                           getFoodItemsForTag(currentTag) : 
                           (foodData[currentTag] || []))}
                onConfigClick={openAmountModal}
                onAddNewFood={openAddFoodModal}
                onEditFood={openEditFoodModal}
                isVirtualTag={currentTag === RECENT_TAG}
            />

            <!-- Show status message if error occurred -->
            {#if usingLocalData || loadError}
                <div class="status-message {loadError ? 'error' : 'info'}">
                    <p>
                        {loadError || t('localModeActive')}
                    </p>
                </div>
            {/if}
        {:else}
            <!-- Non-authenticated user - show login prompt -->
            <div class="login-prompt">
                <div class="login-prompt-content">
                    <div class="login-icon">🍽️</div>
                    <h2>{t('pleaseLoginToStart')}</h2>
                    <p class="login-description">{t('loginToAccessFeatures')}</p>
                    <p class="login-instructions">{t('clickMenuToLogin')}</p>
                    
                    <button class="login-cta-button" on:click={handleLogin}>
                        🔐 {t('loginWithGoogle')}
                    </button>
                </div>
            </div>
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
        {showNotification}
    />
    <AddFoodModal
        bind:showModal={showAddFoodModal}
        currentTag={currentTag === RECENT_TAG ? Object.keys(foodData)[0] || '' : currentTag}
        onAddFood={handleAddNewFood}
        availableTags={availableTags.map(tag => tag.name)}
    />
    <!-- Edit Food Modal -->
    <EditFoodModal
        bind:showModal={showEditFoodModal}
        foodItem={editingFood}
        onSave={handleSaveEditedFood}
        onDelete={handleDeleteFood}
        availableTags={availableTags.map(tag => tag.name)}
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
                            <div class="meal-card">
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

    <!-- Add Tag Modal -->
    {#if showAddTagModal}
        <div class="modal">
            <div class="modal-content add-tag-modal">
                <span class="close-modal" on:click={() => showAddTagModal = false}>&times;</span>
                <h2>{t('addTag')}</h2>

                <div class="form-group">
                    <label for="tag-name">{t('tagName')}</label>
                    <input
                        type="text"
                        id="tag-name"
                        bind:value={newTagName}
                        placeholder={t('enterTagName')}
                    >
                </div>

                <div class="form-actions">
                    <button class="cancel-btn" on:click={() => showAddTagModal = false}>{t('cancel')}</button>
                    <button class="save-btn" on:click={addNewTag} disabled={!newTagName.trim()}>
                        {t('addTag')}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Backup Modal -->
    {#if showBackupModal}
        <div class="modal">
            <div class="modal-content backup-modal">
                <span class="close-modal" on:click={() => showBackupModal = false}>&times;</span>
                <h2>{$i18n('dataBackup')}</h2>

                {#if isBackingUp}
                    <div class="backup-loading">
                        <div class="loading-spinner"></div>
                        <p>{$i18n('creatingBackup')}</p>
                    </div>
                {:else if backupResult}
                    <div class="backup-result {backupResult.success ? 'success' : 'error'}">
                        {#if backupResult.success}
                            <div class="success-icon">✓</div>
                            <h3>{$i18n('backupCompleted')}</h3>
                            <p>{$i18n('backupPrefix')} <code>{backupResult.prefix}</code></p>
                            <div class="backup-stats">
                                <div class="stat-item">
                                    <span class="stat-label">{$i18n('foodItems')}</span>
                                    <span class="stat-value">{backupResult.foodItemsCount}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">{$i18n('meals')}</span>
                                    <span class="stat-value">{backupResult.mealsCount}</span>
                                </div>
                            </div>
                        {:else}
                            <div class="error-icon">✗</div>
                            <h3>{$i18n('backupFailed')}</h3>
                            <p>{backupResult.message}</p>
                        {/if}
                    </div>
                {/if}

                <div class="form-actions">
                    <button
                        class="close-btn"
                        on:click={() => showBackupModal = false}
                    >
                        {$i18n('cancel')}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Notification -->
    {#if notification}
        <div class="notification {notification.type}" transition:fly={{ y: 50, duration: 300 }}>
            {#if notification.type === 'success'}
                <div class="notification-icon">✓</div>
            {:else if notification.type === 'error'}
                <div class="notification-icon">✗</div>
            {/if}
            <div class="notification-message">{notification.message}</div>
        </div>
    {/if}

    <!-- Daily Export Modal -->
    <DailyExportModal
        bind:showModal={showDailyExportModal}
        {showNotification}
    />
    <!-- Backdating Modal -->
    <BackdatingModal
        bind:showModal={showBackdatingModal}
        {showNotification}
    />
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

    /* Tags */
    .tags {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        white-space: nowrap;
        padding: 6px 3px;
        background-color: #f8f8f8;
        border-bottom: 1px solid #e0e0e0;
        gap: 2px;
    }

    .tag-btn {
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

    .tag-btn:hover {
        background-color: #f5f5f5;
    }

    .tag-btn.active {
        background-color: #C26C51;
        color: white;
        border-color: #C26C51;
    }

    .tag-count {
        font-size: 11px;
        opacity: 0.8;
        margin-left: 4px;
        font-weight: normal;
    }

    .tag-btn.loading, .tag-btn.error-tag {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .tag-btn.error-tag {
        background-color: #ffebee;
        color: #c62828;
        border-color: #ffcdd2;
    }

    .add-tag-btn {
        font-weight: bold;
        font-size: 16px;
        padding: 8px 14px;
        color: #7E7E7E;
    }

    /* New styles for tag separator */
    .tag-separator {
        width: 2px;
        background-color: #e0e0e0;
        height: 24px;
        align-self: center;
        margin: 0 10px;
        border-radius: 1px;
    }

    /* Loading state */
    .loading-state {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 300px;
        color: #888;
    }

    /* Login prompt for non-authenticated users */
    .login-prompt {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        padding: 20px;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .login-prompt-content {
        text-align: center;
        background: white;
        padding: 40px 30px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        width: 100%;
    }

    .login-icon {
        font-size: 3rem;
        margin-bottom: 20px;
        animation: bounce 2s infinite;
    }

    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
        }
        40% {
            transform: translateY(-10px);
        }
        60% {
            transform: translateY(-5px);
        }
    }

    .login-prompt h2 {
        color: #333;
        margin-bottom: 15px;
        font-size: 1.5rem;
        font-weight: 600;
    }

    .login-description {
        color: #666;
        margin-bottom: 10px;
        font-size: 1rem;
        line-height: 1.5;
    }

    .login-instructions {
        color: #888;
        margin-bottom: 25px;
        font-size: 0.9rem;
        font-style: italic;
    }

    .login-cta-button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 25px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .login-cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #5a6fd8 0%, #6a4c93 100%);
    }

    .login-cta-button:active {
        transform: translateY(0);
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

    /* Add Tag Modal */
    .add-tag-modal {
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

    /* Backup Modal Styles */
    .backup-modal {
        width: 400px;
        max-width: 90vw;
        text-align: center;
    }

    .backup-loading {
        padding: 30px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .backup-result {
        padding: 20px;
        margin: 20px 0;
        border-radius: 8px;
        text-align: center;
    }

    .backup-result.success {
        background-color: #e8f5e9;
        border: 1px solid #c8e6c9;
    }

    .backup-result.error {
        background-color: #ffebee;
        border: 1px solid #ffcdd2;
    }

    .success-icon {
        font-size: 48px;
        color: #4caf50;
        margin-bottom: 15px;
    }

    .error-icon {
        font-size: 48px;
        color: #f44336;
        margin-bottom: 15px;
    }

    .backup-stats {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-top: 15px;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .stat-label {
        font-size: 14px;
        color: #555;
    }

    .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #333;
    }

    .close-btn {
        background-color: #f5f5f5;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        margin-top: 10px;
    }

    .close-btn:hover {
        background-color: #e5e5e5;
    }

    /* Notification styles */
    .notification {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 25px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        min-width: 280px;
        justify-content: center;
    }

    .notification.success {
        background-color: #4caf50;
        color: white;
    }

    .notification.error {
        background-color: #f44336;
        color: white;
    }

    .notification-icon {
        font-size: 20px;
        margin-right: 12px;
    }

    .notification-message {
        font-size: 16px;
        font-weight: 500;
    }

    @media (max-width: 600px) {
        .meal-item {
            width: 100%;
        }
    }
</style>


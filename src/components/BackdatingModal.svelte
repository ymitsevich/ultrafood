<script>
    import { getContext } from 'svelte';
    import { i18n } from '../stores/language.js';
    
    export let showModal = false;
    export let showNotification = () => {};
    
    // Get services from context
    const { database } = getContext('services');
    
    // State for the backdating processes
    let isRunningFoodItems = false;
    let isRunningMeals = false;
    let isRunningDeletion = false;
    let isRunningTagsCreation = false;
    let foodItemsResult = null;
    let mealsResult = null;
    let deletionResult = null;
    let tagsCreationResult = null;
    
    function closeModal() {
        if (!isRunningFoodItems && !isRunningMeals && !isRunningDeletion && !isRunningTagsCreation) {
            showModal = false;
            foodItemsResult = null;
            mealsResult = null;
            deletionResult = null;
            tagsCreationResult = null;
        }
    }
    
    // Function to run the food items backdating procedure
    async function runFoodItemsBackdating() {
        // Check if Firebase is available
        if (!database.isAvailable()) {
            showNotification($i18n('localModeActive'), 'error');
            return;
        }
        
        try {
            isRunningFoodItems = true;
            foodItemsResult = null;
            
            // Call the backdating procedure
            foodItemsResult = await database.backdateCategoryToTags();
            
            if (foodItemsResult.success) {
                // Show success notification
                showNotification(
                    $i18n('backdateCompleted') + ' ' + 
                    $i18n('backdateItemsProcessed', { count: foodItemsResult.processedCount }) + ', ' +
                    $i18n('backdateItemsUpdated', { count: foodItemsResult.updatedCount }),
                    'success'
                );
                
                // Trigger a custom event to refresh food data in the main app
                window.dispatchEvent(new CustomEvent('foodDataRefresh'));
            } else {
                // Show error notification
                showNotification(
                    $i18n('backdateFailed') + (foodItemsResult.message ? ': ' + foodItemsResult.message : ''),
                    'error'
                );
            }
        } catch (error) {
            console.error('Error during food items backdating procedure:', error);
            
            foodItemsResult = {
                success: false,
                processedCount: 0,
                updatedCount: 0,
                message: error.message
            };
            
            showNotification($i18n('backdateFailed') + ': ' + error.message, 'error');
        } finally {
            isRunningFoodItems = false;
        }
    }
    
    // Function to run the submitted meals backdating procedure
    async function runMealsBackdating() {
        // Check if Firebase is available
        if (!database.isAvailable()) {
            showNotification($i18n('localModeActive'), 'error');
            return;
        }
        
        try {
            isRunningMeals = true;
            mealsResult = null;
            
            // Call the meals backdating procedure
            mealsResult = await database.backdateMealCategoryToTags();
            
            if (mealsResult.success) {
                // Show success notification
                showNotification(
                    $i18n('backdateMealsCompleted') + ' ' + 
                    $i18n('backdateMealsProcessed', { count: mealsResult.processedCount }) + ', ' +
                    $i18n('backdateMealsUpdated', { count: mealsResult.updatedCount }),
                    'success'
                );
            } else {
                // Show error notification
                showNotification(
                    $i18n('backdateMealsFailed') + (mealsResult.message ? ': ' + mealsResult.message : ''),
                    'error'
                );
            }
        } catch (error) {
            console.error('Error during meals backdating procedure:', error);
            
            mealsResult = {
                success: false,
                processedCount: 0,
                updatedCount: 0,
                message: error.message
            };
            
            showNotification($i18n('backdateMealsFailed') + ': ' + error.message, 'error');
        } finally {
            isRunningMeals = false;
        }
    }
    
    // Function to run the category deletion procedure
    async function runCategoryDeletion() {
        // Check if Firebase is available
        if (!database.isAvailable()) {
            showNotification($i18n('localModeActive'), 'error');
            return;
        }
        
        try {
            isRunningDeletion = true;
            deletionResult = null;
            
            // Call the category deletion procedure
            deletionResult = await database.deleteCategoryFields();
            
            if (deletionResult.success) {
                // Show success notification
                showNotification(
                    $i18n('deleteCategoryCompleted') + ' ' + 
                    $i18n('deleteCategoryFoodItems', { count: deletionResult.foodItemsUpdated }) + ', ' +
                    $i18n('deleteCategoryMeals', { count: deletionResult.mealsUpdated }),
                    'success'
                );
                
                // Trigger a custom event to refresh food data in the main app
                window.dispatchEvent(new CustomEvent('foodDataRefresh'));
            } else {
                // Show error notification
                showNotification(
                    $i18n('deleteCategoryFailed') + (deletionResult.message ? ': ' + deletionResult.message : ''),
                    'error'
                );
            }
        } catch (error) {
            console.error('Error during category deletion procedure:', error);
            
            deletionResult = {
                success: false,
                foodItemsProcessed: 0,
                foodItemsUpdated: 0,
                mealsProcessed: 0,
                mealsUpdated: 0,
                message: error.message
            };
            
            showNotification($i18n('deleteCategoryFailed') + ': ' + error.message, 'error');
        } finally {
            isRunningDeletion = false;
        }
    }
    
    // Function to run the tags creation procedure
    async function runTagsCreation() {
        // Check if Firebase is available
        if (!database.isAvailable()) {
            showNotification($i18n('localModeActive'), 'error');
            return;
        }
        
        try {
            isRunningTagsCreation = true;
            tagsCreationResult = null;
            
            // Call the tags creation procedure
            tagsCreationResult = await database.createTagsCollection();
            
            if (tagsCreationResult.success) {
                // Show success notification
                showNotification(
                    $i18n('createTagsCompleted') + ' ' + 
                    $i18n('createTagsCount', { count: tagsCreationResult.tagsCreated }),
                    'success'
                );
                
                // Trigger a custom event to refresh food data in the main app
                window.dispatchEvent(new CustomEvent('foodDataRefresh'));
            } else {
                // Show error notification
                showNotification(
                    $i18n('createTagsFailed') + (tagsCreationResult.message ? ': ' + tagsCreationResult.message : ''),
                    'error'
                );
            }
        } catch (error) {
            console.error('Error during tags creation procedure:', error);
            
            tagsCreationResult = {
                success: false,
                tagsCreated: 0,
                message: error.message
            };
            
            showNotification($i18n('createTagsFailed') + ': ' + error.message, 'error');
        } finally {
            isRunningTagsCreation = false;
        }
    }
</script>

{#if showModal}
    <div class="modal-backdrop" on:click={closeModal}>
        <div class="modal-content" on:click|stopPropagation>
            <span class="close-modal" on:click={closeModal}>&times;</span>
            
            <h2>{$i18n('backdateProcedure')}</h2>
            
            <div class="backdating-options">
                <!-- Food Items Backdating -->
                <div class="backdating-option">
                    <h3>Food Items</h3>
                    <p class="option-description">Move category values to tags for all food items</p>
                    
                    <div class="option-actions">
                        <button 
                            class="primary-button" 
                            on:click={runFoodItemsBackdating}
                            disabled={isRunningFoodItems || isRunningMeals || isRunningDeletion || isRunningTagsCreation}
                        >
                            {#if isRunningFoodItems}
                                <span class="loading-spinner-small"></span>
                                {$i18n('backdateRunning')}
                            {:else}
                                Backdate Food Items
                            {/if}
                        </button>
                        
                        {#if foodItemsResult}
                            <div class="result-status {foodItemsResult.success ? 'success' : 'error'}">
                                {#if foodItemsResult.success}
                                    ✓ {foodItemsResult.processedCount} processed, {foodItemsResult.updatedCount} updated
                                {:else}
                                    ✗ Failed: {foodItemsResult.message}
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>
                
                <!-- Submitted Meals Backdating -->
                <div class="backdating-option">
                    <h3>Submitted Meals</h3>
                    <p class="option-description">Move category values to tags for food items within meals</p>
                    
                    <div class="option-actions">
                        <button 
                            class="primary-button" 
                            on:click={runMealsBackdating}
                            disabled={isRunningFoodItems || isRunningMeals || isRunningDeletion || isRunningTagsCreation}
                        >
                            {#if isRunningMeals}
                                <span class="loading-spinner-small"></span>
                                {$i18n('backdateRunning')}
                            {:else}
                                Backdate Meal Items
                            {/if}
                        </button>
                        
                        {#if mealsResult}
                            <div class="result-status {mealsResult.success ? 'success' : 'error'}">
                                {#if mealsResult.success}
                                    ✓ {mealsResult.processedCount} processed, {mealsResult.updatedCount} updated
                                {:else}
                                    ✗ Failed: {mealsResult.message}
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>
                
                <!-- Category Deletion -->
                <div class="backdating-option">
                    <h3>Category Deletion</h3>
                    <p class="option-description">Delete category values from all food items and meals</p>
                    
                    <div class="option-actions">
                        <button 
                            class="primary-button" 
                            on:click={runCategoryDeletion}
                            disabled={isRunningFoodItems || isRunningMeals || isRunningDeletion || isRunningTagsCreation}
                        >
                            {#if isRunningDeletion}
                                <span class="loading-spinner-small"></span>
                                {$i18n('deletionRunning')}
                            {:else}
                                Delete Categories
                            {/if}
                        </button>
                        
                        {#if deletionResult}
                            <div class="result-status {deletionResult.success ? 'success' : 'error'}">
                                {#if deletionResult.success}
                                    ✓ {deletionResult.foodItemsUpdated} food items, {deletionResult.mealsUpdated} meals updated
                                {:else}
                                    ✗ Failed: {deletionResult.message}
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>
                
                <!-- Tags Creation -->
                <div class="backdating-option">
                    <h3>Tags Creation</h3>
                    <p class="option-description">Create tags for all food items based on categories</p>
                    
                    <div class="option-actions">
                        <button 
                            class="primary-button" 
                            on:click={runTagsCreation}
                            disabled={isRunningFoodItems || isRunningMeals || isRunningDeletion || isRunningTagsCreation}
                        >
                            {#if isRunningTagsCreation}
                                <span class="loading-spinner-small"></span>
                                {$i18n('createTagsRunning')}
                            {:else}
                                Create Tags Collection
                            {/if}
                        </button>
                        
                        {#if tagsCreationResult}
                            <div class="result-status {tagsCreationResult.success ? 'success' : 'error'}">
                                {#if tagsCreationResult.success}
                                    ✓ {tagsCreationResult.tagsCreated} tags created
                                {:else}
                                    ✗ Failed: {tagsCreationResult.message}
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="cancel-button" on:click={closeModal}>
                    Close
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
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
        background-color: white;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    h2 {
        margin-top: 0;
        margin-bottom: 20px;
        text-align: center;
        color: #333;
    }

    .close-modal {
        position: absolute;
        top: 16px;
        right: 16px;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    }

    .close-modal:hover {
        color: #000;
    }

    .backdating-options {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 20px;
    }

    .backdating-option {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        background-color: #fafafa;
    }

    .backdating-option h3 {
        margin: 0 0 8px 0;
        color: #333;
        font-size: 16px;
    }

    .option-description {
        margin: 0 0 12px 0;
        color: #666;
        font-size: 14px;
        line-height: 1.4;
    }

    .option-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .primary-button {
        padding: 10px 16px;
        background-color: #C26C51;
        border: none;
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .primary-button:hover:not(:disabled) {
        background-color: #a85a43;
    }

    .primary-button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }

    .loading-spinner-small {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .result-status {
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
    }

    .result-status.success {
        background-color: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #c8e6c9;
    }

    .result-status.error {
        background-color: #ffebee;
        color: #c62828;
        border: 1px solid #ffcdd2;
    }

    .modal-footer {
        display: flex;
        justify-content: center;
        margin-top: 20px;
    }

    .cancel-button {
        padding: 10px 20px;
        background-color: transparent;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
    }

    .cancel-button:hover {
        background-color: #f5f5f5;
    }

    @media (max-width: 600px) {
        .modal-content {
            padding: 20px;
            margin: 20px;
        }
    }
</style>
<script>
    import { onMount, getContext } from 'svelte';
    
    // Get services from context
    const services = getContext('services') || {};
    const { firebase } = services;

    // Exported props
    export let showModal = false;
    export let meal = null;
    export let onSave = () => {};
    export let onDelete = () => {};

    // Local state
    let editedMeal = null;
    let isLoading = false;
    let errorMessage = '';
    let confirmDelete = false;

    // Initialize the edited meal whenever the input meal changes
    $: if (meal && showModal) {
        // Deep clone the meal to avoid modifying the original
        editedMeal = JSON.parse(JSON.stringify(meal));
        confirmDelete = false;
    }

    // Handle removing a food item from the meal
    function removeItem(index) {
        if (!editedMeal || !editedMeal.items) return;
        
        // Create a new array without the item at the specified index
        editedMeal.items = editedMeal.items.filter((_, i) => i !== index);
    }

    // Handle changing a food item's amount
    function updateItemAmount(index, newAmount) {
        if (!editedMeal || !editedMeal.items) return;
        
        // Store the original amount as a string without attempting to parse it
        // This allows amounts with units like "20g", "1 cup", etc.
        editedMeal.items[index].amount = newAmount;
    }

    // Save the edited meal
    async function saveMeal() {
        if (!editedMeal) return;
        
        // Validate that we have at least one food item
        if (!editedMeal.items || editedMeal.items.length === 0) {
            errorMessage = 'A meal must contain at least one food item';
            return;
        }
        
        try {
            isLoading = true;
            errorMessage = '';
            
            // Update the meal in the database using the firebase service from the container
            await firebase.updateSubmittedMeal(editedMeal);
            
            // Notify the parent component
            onSave(editedMeal);
            
            // Close the modal
            closeModal();
        } catch (error) {
            console.error('Error updating meal:', error);
            errorMessage = 'Failed to update the meal: ' + error.message;
        } finally {
            isLoading = false;
        }
    }

    // Delete the meal
    async function deleteMeal() {
        if (!editedMeal || !editedMeal.id) return;
        
        try {
            isLoading = true;
            errorMessage = '';
            
            // Delete the meal from the database using the firebase service from the container
            await firebase.deleteSubmittedMeal(editedMeal.id);
            
            // Notify the parent component
            onDelete(editedMeal.id);
            
            // Close the modal
            closeModal();
        } catch (error) {
            console.error('Error deleting meal:', error);
            errorMessage = 'Failed to delete the meal: ' + error.message;
        } finally {
            isLoading = false;
        }
    }

    // Close the modal
    function closeModal() {
        showModal = false;
        errorMessage = '';
        confirmDelete = false;
    }

    // Format the date for display
    function formatDate(isoString) {
        try {
            const date = new Date(isoString);
            return date.toLocaleString();
        } catch (e) {
            return isoString;
        }
    }
</script>

{#if showModal && editedMeal}
    <div class="modal">
        <div class="modal-content edit-meal-modal">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            <h2>Edit Meal</h2>
            
            <!-- Meal timestamp -->
            <div class="meal-timestamp">
                {formatDate(editedMeal.timestamp)}
            </div>
            
            <!-- Meal items -->
            <div class="meal-items-container">
                <h3>Food Items</h3>
                {#if editedMeal.items && editedMeal.items.length > 0}
                    {#each editedMeal.items as item, index (index)}
                        <div class="meal-item">
                            <div class="meal-item-visual">
                                {#if item.imageUrl || item.image}
                                    <img src={item.imageUrl || item.image} alt={item.name} class="meal-item-image" />
                                {:else if item.imageData}
                                    <img src={item.imageData} alt={item.name} class="meal-item-image" />
                                {:else}
                                    <span class="meal-item-emoji">{item.emoji || '🍽️'}</span>
                                {/if}
                            </div>
                            <div class="meal-item-details">
                                <span class="meal-item-name">{item.name}</span>
                                <div class="amount-control">
                                    <input 
                                        type="text"
                                        class="amount-input"
                                        value={item.amount}
                                        on:input={(e) => updateItemAmount(index, e.target.value)}
                                    />
                                </div>
                            </div>
                            <button class="remove-item-btn" on:click={() => removeItem(index)}>
                                &times;
                            </button>
                        </div>
                    {/each}
                {:else}
                    <div class="empty-items">
                        <p>This meal has no items. Add at least one food item or delete the meal.</p>
                    </div>
                {/if}
            </div>
            
            <!-- Error message -->
            {#if errorMessage}
                <div class="error-message">
                    {errorMessage}
                </div>
            {/if}
            
            <!-- Action buttons -->
            <div class="actions">
                <div class="left-actions">
                    {#if !confirmDelete}
                        <button 
                            class="delete-btn" 
                            on:click={() => confirmDelete = true}
                            disabled={isLoading}
                        >
                            Delete Meal
                        </button>
                    {:else}
                        <button 
                            class="confirm-delete-btn" 
                            on:click={deleteMeal}
                            disabled={isLoading}
                        >
                            Confirm Delete
                        </button>
                        <button 
                            class="cancel-delete-btn" 
                            on:click={() => confirmDelete = false}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    {/if}
                </div>
                <div class="right-actions">
                    <button class="cancel-btn" on:click={closeModal} disabled={isLoading}>
                        Cancel
                    </button>
                    <button 
                        class="save-btn" 
                        on:click={saveMeal}
                        disabled={isLoading || confirmDelete || !editedMeal.items || editedMeal.items.length === 0}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Modal styles */
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
        background-color: white;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 520px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    h2 {
        margin-top: 0;
        margin-bottom: 16px;
        text-align: center;
        color: #333;
    }
    
    h3 {
        font-size: 18px;
        color: #444;
        margin-bottom: 12px;
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
    
    .meal-timestamp {
        background-color: #f8f8f8;
        padding: 8px 12px;
        border-radius: 6px;
        margin: 0 0 16px;
        font-size: 14px;
        color: #444;
        text-align: center;
    }

    /* Meal items styles */
    .meal-items-container {
        margin: 16px 0;
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 16px;
        background-color: #fafafa;
    }
    
    .meal-item {
        display: flex;
        align-items: center;
        background: white;
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        position: relative;
    }
    
    .meal-item:last-child {
        margin-bottom: 0;
    }
    
    .meal-item-visual {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 6px;
        margin-right: 12px;
        background-color: #f0f0f0;
    }
    
    .meal-item-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .meal-item-emoji {
        font-size: 24px;
    }
    
    .meal-item-details {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    
    .meal-item-name {
        font-weight: 500;
        font-size: 16px;
        margin-bottom: 4px;
    }
    
    .amount-control {
        display: flex;
        align-items: center;
    }
    
    .amount-input {
        width: 60px;
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        text-align: center;
    }
    
    .remove-item-btn {
        background: none;
        border: none;
        color: #e74c3c;
        font-size: 20px;
        font-weight: bold;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .remove-item-btn:hover {
        background-color: rgba(231, 76, 60, 0.1);
    }
    
    .empty-items {
        text-align: center;
        padding: 20px 0;
        color: #888;
        font-style: italic;
    }

    /* Error message */
    .error-message {
        color: #e74c3c;
        padding: 8px 12px;
        background-color: #feeef0;
        border-radius: 4px;
        margin: 16px 0;
        text-align: center;
    }

    /* Action buttons */
    .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
    }
    
    .left-actions, .right-actions {
        display: flex;
        gap: 8px;
    }

    .save-btn {
        padding: 10px 20px;
        background-color: #3498db;
        border: none;
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-size: 15px;
    }

    .save-btn:hover:not([disabled]) {
        background-color: #2980b9;
    }
    
    .save-btn:disabled {
        background-color: #95a5a6;
        cursor: not-allowed;
    }

    .cancel-btn {
        padding: 10px 20px;
        background-color: transparent;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
        font-size: 15px;
    }

    .cancel-btn:hover:not([disabled]) {
        background-color: #f5f5f5;
    }
    
    .delete-btn {
        padding: 10px 20px;
        background-color: transparent;
        border: 1px solid #e74c3c;
        border-radius: 6px;
        color: #e74c3c;
        cursor: pointer;
        font-size: 15px;
    }
    
    .delete-btn:hover:not([disabled]) {
        background-color: #fef5f5;
    }
    
    .confirm-delete-btn {
        padding: 10px 20px;
        background-color: #e74c3c;
        border: none;
        border-radius: 6px;
        color: white;
        cursor: pointer;
        font-size: 15px;
    }
    
    .confirm-delete-btn:hover:not([disabled]) {
        background-color: #c0392b;
    }
    
    .cancel-delete-btn {
        padding: 10px 20px;
        background-color: transparent;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
        font-size: 15px;
    }
    
    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>
<script>
    import { basket } from './stores/basket.js';
    import { getContext } from 'svelte';
    
    // Exported props
    export let onSubmitBasket;
    export let onMealSubmitted = () => {}; // Callback for when a meal is submitted successfully
    
    // Get services from the nearest parent component
    const services = getContext('services') || {};
    const firebase = services.firebase;
    
    // Constants
    const SUBMIT_NOW_MESSAGE = 'Logged {count} items to your meal (Now)!';
    
    // Submit basket with "Now" time option
    async function submitNow() {
        if ($basket.length === 0) return;
        
        try {
            // Make a deep copy of the basket items
            const basketItems = JSON.parse(JSON.stringify($basket));
            
            // Generate current timestamp
            const timestamp = new Date().toISOString();
            
            // Log action
            console.log("Submitting basket with time: Now");
            
            // Save meal to Firebase
            const mealId = await firebase.saveSubmittedMeal(basketItems, timestamp);
            
            if (mealId) {
                // Show confirmation
                showConfirmation($basket.length);
                
                // Clear the basket after submission
                basket.clear();
                
                // Call the callback to refresh submitted meals
                onMealSubmitted();
            } else {
                alert('Failed to log meal. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting meal:', error);
            alert('An unexpected error occurred.');
        }
    }
    
    // Display confirmation message
    function showConfirmation(itemCount) {
        const message = SUBMIT_NOW_MESSAGE.replace('{count}', itemCount);
        alert(message);
    }
    
    // Remove item from basket
    function removeItem(index) {
        basket.remove(index);
    }
</script>

<div class="basket-sidebar">
    <div class="basket-items">
        {#if $basket.length === 0}
            <div class="empty-basket"></div>
        {:else}
            {#each $basket as item, index (index)}
                <div class="basket-item">
                    <div class="basket-item-visual">
                        {#if item.imageUrl || item.image}
                            <img 
                                src={item.imageUrl || item.image} 
                                alt={item.name} 
                                class="basket-item-image"
                            />
                        {:else if item.imageData}
                            <img 
                                src={item.imageData} 
                                alt={item.name} 
                                class="basket-item-image"
                            />
                        {:else}
                            <div class="basket-item-emoji">{item.emoji}</div>
                        {/if}
                        <div class="remove-icon" on:click={() => removeItem(index)}>×</div>
                    </div>
                    <div class="basket-item-details">
                        <div class="basket-item-name" title="{item.name}">{item.name}</div>
                        <div class="basket-item-amount" title="{item.amount}">{item.amount}</div>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
    
    {#if $basket.length > 0}
        <div class="submit-buttons">
            <div class="submit-icon now-icon" on:click={submitNow} title="Submit Now">
                ✓
            </div>
            <div class="submit-icon check-icon" on:click={onSubmitBasket} title="Choose Time">
                ⏱️
            </div>
        </div>
    {/if}
</div>

<style>
    .basket-sidebar {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #f5f5f5;
        width: 7%; 
        min-width: 80px;
        max-width: 120px;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        position: relative; /* Change from fixed to relative */
        z-index: 5;
    }
    
    .basket-items {
        flex: 1;
        overflow-y: auto;
        padding: 8px 6px;
        overflow-x: hidden;
    }
    
    .empty-basket {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
    }
    
    .basket-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 4px;
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        margin-bottom: 8px;
        width: 100%;
        box-sizing: border-box;
        position: relative;
    }
    
    .basket-item-details {
        width: 100%;
        margin-top: 5px;
        text-align: center;
    }
    
    .basket-item-name {
        font-weight: 500;
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .basket-item-amount {
        font-size: 10px;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .remove-icon {
        position: absolute;
        top: -5px;
        right: -5px;
        background: rgba(255,255,255,0.9);
        color: #999;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        opacity: 0.7;
        transition: all 0.2s;
    }
    
    .remove-icon:hover {
        opacity: 1;
        color: #e74c3c;
        transform: scale(1.1);
    }
    
    .basket-item-visual {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
    }
    
    .basket-item-emoji {
        font-size: 24px;
    }
    
    .basket-item-image {
        width: 40px;
        height: 40px;
        border-radius: 6px;
        object-fit: cover;
    }
    
    .submit-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px 0;
        width: 100%;
        background: rgba(255,255,255,0.5);
        gap: 8px;
    }

    .submit-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 16px;
        opacity: 0.8;
    }
    
    .submit-icon:hover {
        opacity: 1;
        transform: scale(1.1);
    }
    
    .now-icon {
        background: rgba(74, 109, 167, 0.2);
        color: #4a6da7;
    }
    
    .check-icon {
        background: rgba(194, 108, 81, 0.2);
        color: #C26C51FF;
    }
    
    .now-icon:hover {
        background: rgba(74, 109, 167, 0.3);
    }
    
    .check-icon:hover {
        background: rgba(194, 108, 81, 0.3);
    }
</style>

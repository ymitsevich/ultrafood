<script>
    import { basket } from './stores/basket.js';
    
    // Exported props
    export let onSubmitBasket;
    
    // Constants
    const SUBMIT_NOW_MESSAGE = 'Logged {count} items to your meal (Now)!';
    
    // Submit basket with "Now" time option
    function submitNow() {
        if ($basket.length === 0) return;
        
        // Log action and show confirmation
        console.log("Submitting basket with time: Now");
        showConfirmation($basket.length);
        
        // Clear the basket after submission
        basket.clear();
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
                        {#if item.imageData}
                            <img 
                                src={item.imageData} 
                                alt={item.name} 
                                class="basket-item-image"
                            />
                        {:else}
                            <div class="basket-item-emoji">{item.emoji}</div>
                        {/if}
                    </div>
                    <div class="basket-item-details">
                        <div class="basket-item-name">{item.name}</div>
                        <div class="basket-item-amount">{item.amount}</div>
                    </div>
                    <button 
                        class="basket-item-remove" 
                        on:click={() => removeItem(index)}
                        aria-label="Remove {item.name}"
                    >
                        ✕
                    </button>
                </div>
            {/each}
        {/if}
    </div>
    
    {#if $basket.length > 0}
        <div class="submit-buttons">
            <button 
                class="submit-basket now-btn" 
                on:click={submitNow} 
                title="Submit Now"
            >
                ⏱️
            </button>
            <button 
                class="submit-basket time-btn" 
                on:click={onSubmitBasket} 
                title="Choose Time"
            >
                ✓
            </button>
        </div>
    {/if}
</div>

<style>
    .basket-sidebar {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: #f5f5f5;
    }
    
    .basket-items {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
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
        align-items: center;
        padding: 10px;
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        margin-bottom: 8px;
    }
    
    .basket-item-details {
        flex: 1;
    }
    
    .basket-item-name {
        font-weight: 500;
        margin-bottom: 2px;
    }
    
    .basket-item-amount {
        font-size: 12px;
        color: #666;
    }
    
    .basket-item-remove {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        font-size: 16px;
        padding: 5px;
        border-radius: 50%;
        transition: all 0.2s;
    }
    
    .basket-item-remove:hover {
        color: #e74c3c;
        background-color: rgba(231, 76, 60, 0.1);
    }
    
    .basket-item-visual {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        font-size: 24px;
        margin-right: 10px;
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
        gap: 10px;
        margin: 15px 5px;
        width: 100%;
    }

    .submit-basket {
        background-color: #C26C51FF;
        color: white;
        border: none;
        border-radius: 50%;
        padding: 12px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        flex-shrink: 0;
        transition: background-color 0.2s, transform 0.1s;
    }
    
    .submit-basket:active {
        transform: scale(0.95);
    }

    .now-btn {
        background-color: #4a6da7;
    }

    .now-btn:hover {
        background-color: #3a5d97;
    }

    .time-btn:hover {
        background-color: #a35a42;
    }
</style>

<script>
    import { basket } from './stores/basket.js';
    
    // Function to handle submit basket action
    export let onSubmitBasket; // callback for when submit is clicked
    
    // New function to submit basket with "Now" time option
    function submitNow() {
        console.log("Submitting basket with time: Now");
        
        // Display a confirmation message
        const itemCount = $basket.length;
        alert(`Logged ${itemCount} items to your meal (Now)!`);
        
        // Clear the basket after submission
        basket.clear();
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
                            <img src={item.imageData} alt={item.name} class="basket-item-image"/>
                        {:else}
                            <div class="basket-item-emoji">{item.emoji}</div>
                        {/if}
                    </div>
                    <div class="basket-item-details">
                        <div class="basket-item-name">{item.name}</div>
                        <div class="basket-item-amount">{item.amount}</div>
                    </div>
                    <button class="basket-item-remove" on:click={() => basket.remove(index)}>
                        ✕
                    </button>
                </div>
            {/each}
        {/if}
    </div>
    {#if $basket.length > 0}
        <div class="submit-buttons">
            <button class="submit-basket now-btn" on:click={submitNow} title="Submit Now">
                ⏱️
            </button>
            <button class="submit-basket time-btn" on:click={onSubmitBasket} title="Choose Time">
                ✓
            </button>
        </div>
    {/if}
</div>

<style>
    .submit-buttons {
        display: flex;
        flex-direction: column; /* Changed from row to column */
        align-items: center;     /* Center buttons horizontally */
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
    }

    .now-btn {
        background-color: #4a6da7; /* Different color to distinguish from regular submit */
    }

    .now-btn:hover {
        background-color: #3a5d97;
    }

    .time-btn:hover {
        background-color: #a35a42;
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
</style>

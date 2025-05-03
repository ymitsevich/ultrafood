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
                    <div class="basket-item-emoji">{item.emoji}</div>
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
        justify-content: center;
        gap: 10px;
        margin: 10px 5px;
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
</style>

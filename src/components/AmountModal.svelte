<script>
    import { foodDefaults } from '../stores/foodDefaults.js';
    import { basket } from '../stores/basket.js';
    
    export let selectedFood = null;
    export let showModal = false;
    
    let selectedAmount = '';
    let customAmount = '';
    
    $: if (selectedFood && showModal) {
        selectedAmount = $foodDefaults[selectedFood.id]?.amount || '100g';
    }
    
    function closeModal() {
        showModal = false;
    }
    
    // Function to save amount and close modal
    function saveAndClose(amount) {
        if (selectedFood) {
            // Save as default
            foodDefaults.setDefault(selectedFood.id, amount);
            
            // Add to basket with selected amount and include image properties
            basket.add({ 
                ...selectedFood, 
                amount: amount,
                // Explicitly ensure image properties are included
                imageData: selectedFood.imageData || null,
                imageUrl: selectedFood.imageUrl || null
            });
            
            // Close the modal
            closeModal();
        }
    }
    
    function setCustomAmount() {
        if (customAmount.trim()) {
            saveAndClose(customAmount.trim());
        }
    }
</script>

{#if showModal && selectedFood}
    <div class="modal" style="display: flex;">
        <div class="modal-content">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            <div class="amount-options">
                <button class="amount-btn" on:click={() => saveAndClose('20g')}>20g</button>
                <button class="amount-btn" on:click={() => saveAndClose('30g')}>30g</button>
                <button class="amount-btn" on:click={() => saveAndClose('50g')}>50g</button>
                <button class="amount-btn" on:click={() => saveAndClose('100g')}>100g</button>
                <button class="amount-btn" on:click={() => saveAndClose('150g')}>150g</button>
                <button class="amount-btn" on:click={() => saveAndClose('200g')}>200g</button>
                <button class="amount-btn" on:click={() => saveAndClose('1 piece')}>1 piece</button>
                <button class="amount-btn" on:click={() => saveAndClose('2 pieces')}>2 pieces</button>
            </div>
            <div class="custom-amount">
                <input 
                    type="text" 
                    bind:value={customAmount} 
                    placeholder="Custom amount..." 
                />
                <button on:click={setCustomAmount} class="custom-amount-btn">Add</button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 100;
    }
    
    .modal-content {
        background-color: white;
        width: 90%;
        max-width: 480px; /* Reduced from 600px */
        border-radius: 16px; /* Reduced from 20px */
        padding: 25px; /* Reduced from 35px */
        position: relative;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    }
    
    .close-modal {
        position: absolute;
        top: 15px;
        right: 15px;
        font-size: 28px; /* Reduced from 32px */
        cursor: pointer;
        color: #666;
    }
    
    .close-modal:hover {
        color: #333;
    }
    
    .amount-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px; /* Reduced from 20px */
        margin-bottom: 20px; /* Reduced from 30px */
        padding-top: 10px; /* Added padding since title is removed */
    }
    
    .amount-btn {
        padding: 18px; /* Reduced from 25px */
        border: 2px solid #ddd;
        border-radius: 10px; /* Reduced from 12px */
        background-color: #f9f9f9;
        font-size: 20px; /* Reduced from 24px */
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 80px; /* Reduced from 100px */
    }
    
    .amount-btn:hover {
        background-color: #C26C51FF;
        color: white;
        border-color: #C26C51FF;
        transform: translateY(-4px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.1);
    }
    
    .custom-amount {
        display: flex;
        justify-content: center;
        margin: 15px auto; /* Reduced from 20px */
        width: 90%; /* Increased from 80% for better proportions */
    }
    
    /* Override any styles from main.css */
    :global(.custom-amount) {
        margin: 15px auto !important;
        width: 90% !important;
    }
    
    .custom-amount input {
        flex: 1;
        padding: 10px;
        border: 2px solid #ddd;
        border-radius: 8px 0 0 8px;
        font-size: 16px;
        height: 40px; /* Reduced from 50px */
    }
    
    .custom-amount-btn {
        background-color: #C26C51FF;
        color: white;
        border: none;
        border-radius: 0 8px 8px 0;
        padding: 0 15px;
        cursor: pointer;
        font-size: 16px; /* Reduced from 18px */
        font-weight: bold;
        height: 40px; /* Reduced from 50px */
        white-space: nowrap;
    }
</style>
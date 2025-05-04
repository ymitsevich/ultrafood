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
            <h2>Set Amount: {selectedFood.emoji} {selectedFood.name}</h2>
            <div class="amount-options">
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
            <!-- Removed save button as we now save immediately upon selecting an amount -->
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
        max-width: 600px; /* Increased from 400px */
        border-radius: 20px; /* Increased from 15px */
        padding: 35px; /* Increased from 25px */
        position: relative;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3); /* Enhanced shadow */
    }
    
    .close-modal {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 32px; /* Increased from 24px */
        cursor: pointer;
        color: #666;
    }
    
    .close-modal:hover {
        color: #333;
    }
    
    h2 {
        margin-bottom: 30px; /* Increased from 20px */
        font-size: 28px; /* Increased from 20px */
        padding-right: 25px;
    }
    
    .amount-options {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px; /* Increased from 10px */
        margin-bottom: 30px; /* Increased from 20px */
    }
    
    .amount-btn {
        padding: 25px; /* Increased from 15px */
        border: 2px solid #ddd; /* Increased border */
        border-radius: 12px; /* Increased from 8px */
        background-color: #f9f9f9;
        font-size: 24px; /* Increased from 16px */
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 100px; /* Added fixed height */
    }
    
    .amount-btn:hover {
        background-color: #C26C51FF;
        color: white;
        border-color: #C26C51FF;
        transform: translateY(-4px); /* Added transform effect */
        box-shadow: 0 6px 12px rgba(0,0,0,0.1); /* Added shadow */
    }
    
    .custom-amount {
        display: flex;
        gap: 15px; /* Increased from 10px */
        margin: 30px 0; /* Increased from 20px */
    }
    
    .custom-amount input {
        flex: 1;
        padding: 20px; /* Increased from 12px */
        border: 2px solid #ddd; /* Increased border */
        border-radius: 12px; /* Increased from 8px */
        font-size: 24px; /* Increased from 16px */
    }
    
    .custom-amount-btn {
        background-color: #C26C51FF;
        color: white;
        border: none;
        border-radius: 12px; /* Increased from 8px */
        padding: 0 25px; /* Increased from 0 15px */
        cursor: pointer;
        font-size: 24px; /* Increased from default */
        font-weight: bold;
    }
    
    .custom-amount-btn:hover {
        background-color: #a35a42;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
</style>
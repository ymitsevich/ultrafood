<script>
    import { basket } from '../stores/basket.js';
    
    export let showModal = false;
    
    let mealTime = '';
    
    function closeModal() {
        showModal = false;
    }
    
    function selectTime(time) {
        mealTime = time;
        
        // If the time is Custom, capture the value from the input field
        if (time === 'Custom') {
            const customTimeInput = document.getElementById('customTimeInput');
            if (customTimeInput && customTimeInput.value) {
                time = `at ${customTimeInput.value}`;
            } else {
                time = 'Custom time (not specified)';
            }
        }
        
        // Submit the basket with the selected time
        submitWithTime(time);
    }
    
    function submitWithTime(time) {
        console.log(`Submitting basket at time: ${time}`);
        
        // Display a confirmation message
        const itemCount = $basket.length;
        alert(`Logged ${itemCount} items to your meal (${time})!`);
        
        // Clear the basket after submission
        basket.clear();
        
        // Close the modal
        closeModal();
    }
</script>

{#if showModal}
    <div class="modal" style="display: flex;">
        <div class="modal-content time-modal-content">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            <h2 class="time-modal-heading">When did you eat?</h2>
            <div class="time-options">
                <button class="time-option-btn" on:click={() => selectTime('Now')}>
                    <span class="time-icon">⏱️</span>
                    <span>Now</span>
                </button>
                <button class="time-option-btn" on:click={() => selectTime('20 min ago')}>
                    <span class="time-icon">⏰</span>
                    <span>20 min ago</span>
                </button>
                <button class="time-option-btn" on:click={() => selectTime('1 hour ago')}>
                    <span class="time-icon">🕒</span>
                    <span>1 hour ago</span>
                </button>
                <button class="time-option-btn" on:click={() => selectTime('Custom')}>
                    <span class="time-icon">📆</span>
                    <span>Custom</span>
                </button>
            </div>
            {#if mealTime === 'Custom'}
                <div class="custom-time-container">
                    <input type="datetime-local" id="customTimeInput" class="custom-time-input" />
                    <button class="custom-time-submit" on:click={() => selectTime(`Custom`)}>
                        <span class="time-icon">✓</span>
                        <span>Confirm</span>
                    </button>
                </div>
            {/if}
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
        z-index: 1000;
    }
    
    .modal-content {
        background: white;
        padding: 40px; /* Increased from 25px */
        border-radius: 20px; /* Increased from 12px */
        text-align: center;
        max-width: 800px; /* Increased from 400px */
        width: 90%;
        position: relative;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2); /* Enhanced shadow */
    }
    
    .time-modal-heading {
        margin-top: 15px;
        margin-bottom: 30px;
        color: #333;
        font-size: 32px; /* Increased from default */
    }
    
    .close-modal {
        position: absolute;
        top: 25px;
        right: 25px;
        font-size: 36px; /* Increased from 24px */
        cursor: pointer;
        color: #999;
    }
    
    .close-modal:hover {
        color: #333;
    }
    
    .time-options {
        display: grid; /* Changed from flex to grid */
        grid-template-columns: repeat(2, 1fr); /* 2 columns */
        gap: 20px; /* Increased from 12px */
        margin: 30px 0; /* Increased from 20px */
    }
    
    .time-option-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px; /* Increased from 12px */
        background-color: #C26C51FF;
        color: white;
        border: none;
        border-radius: 16px; /* Increased from 8px */
        padding: 25px; /* Increased from 12px 20px */
        font-size: 24px; /* Increased from 16px */
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s, background-color 0.2s;
        min-height: 120px; /* Added fixed height */
    }
    
    .time-option-btn:hover {
        background-color: #a35a42;
        transform: translateY(-4px); /* Increased effect */
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1); /* Added shadow on hover */
    }
    
    .time-icon {
        font-size: 40px; /* Increased from 20px */
    }
    
    .custom-time-container {
        margin-top: 30px; /* Increased from 20px */
        display: flex;
        flex-direction: column;
        gap: 20px; /* Increased from 12px */
    }
    
    .custom-time-input {
        padding: 20px; /* Increased from 12px */
        border: 1px solid #ddd;
        border-radius: 12px; /* Increased from 8px */
        font-size: 24px; /* Increased from 16px */
    }
    
    .custom-time-submit {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px; /* Increased from 10px */
        background-color: #C26C51FF;
        color: white;
        border: none;
        border-radius: 16px; /* Increased from 8px */
        padding: 25px; /* Increased from 12px 20px */
        font-size: 24px; /* Increased from 16px */
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .custom-time-submit:hover {
        background-color: #a35a42;
        transform: translateY(-4px); /* Added transform effect */
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1); /* Added shadow */
    }
</style>
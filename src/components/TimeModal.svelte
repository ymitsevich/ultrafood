<script>
    import { basket } from '../stores/basket.js';
    import { saveSubmittedMeal } from '../firebase.js';
    
    // Exported props
    export let showModal = false;
    export let onMealSubmitted = () => {}; // Callback when meal is submitted successfully

    // Local state
    let selectedTime = 'now';
    let customDate = '';
    let customTime = '';
    let submissionInProgress = false;
    let submissionError = null;

    // Get today's date as YYYY-MM-DD for default date input
    $: today = new Date().toISOString().split('T')[0];

    function closeModal() {
        showModal = false;
    }

    // Handle meal submission
    async function handleSubmit() {
        if ($basket.length === 0) return;

        let timestamp;
        submissionInProgress = true;
        submissionError = null;

        try {
            // Format the timestamp based on selection
            if (selectedTime === 'now') {
                timestamp = new Date().toISOString();
            } else if (selectedTime === 'custom') {
                if (!customDate) {
                    submissionError = "Please select a date";
                    submissionInProgress = false;
                    return;
                }
                
                const timeValue = customTime || '12:00';
                timestamp = new Date(`${customDate}T${timeValue}`).toISOString();
            }

            // Make a deep copy of the basket items
            const basketItems = JSON.parse(JSON.stringify($basket));

            // Save the meal to Firestore
            const mealId = await saveSubmittedMeal(basketItems, timestamp);
            
            if (mealId) {
                // Show confirmation
                const message = `Meal logged successfully for ${formatTimeForDisplay(timestamp)}`;
                alert(message);
                
                // Clear basket and close modal
                basket.clear();
                closeModal();
                
                // Call the callback to refresh submitted meals
                onMealSubmitted();
            } else {
                submissionError = "Failed to save meal. Please try again.";
            }
        } catch (error) {
            console.error("Error submitting meal:", error);
            submissionError = "An unexpected error occurred.";
        } finally {
            submissionInProgress = false;
        }
    }
    
    // Format time for user display
    function formatTimeForDisplay(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString();
    }
</script>

{#if showModal}
    <div class="modal" style="display: flex;">
        <div class="modal-content">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            <h2>When did you eat this?</h2>
            
            <div class="time-options">
                <label class="time-option">
                    <input 
                        type="radio" 
                        name="timeOption" 
                        value="now" 
                        bind:group={selectedTime} 
                    />
                    <span>Now (Current time)</span>
                </label>
                
                <label class="time-option">
                    <input 
                        type="radio" 
                        name="timeOption" 
                        value="custom" 
                        bind:group={selectedTime} 
                    />
                    <span>Custom time</span>
                </label>
                
                {#if selectedTime === 'custom'}
                    <div class="custom-time-inputs">
                        <div class="input-group">
                            <label for="date-input">Date:</label>
                            <input 
                                type="date" 
                                id="date-input"
                                bind:value={customDate}
                                max={today}
                            />
                        </div>
                        
                        <div class="input-group">
                            <label for="time-input">Time:</label>
                            <input 
                                type="time" 
                                id="time-input"
                                bind:value={customTime}
                            />
                        </div>
                    </div>
                {/if}
            </div>
            
            {#if submissionError}
                <p class="error-message">{submissionError}</p>
            {/if}
            
            <button 
                class="submit-btn" 
                on:click={handleSubmit} 
                disabled={submissionInProgress || $basket.length === 0}
            >
                {#if submissionInProgress}
                    Submitting...
                {:else}
                    Submit
                {/if}
            </button>
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
        background-color: white;
        width: 90%;
        max-width: 500px;
        border-radius: 20px;
        padding: 30px;
        position: relative;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    }
    
    .close-modal {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 32px;
        cursor: pointer;
        color: #666;
    }
    
    .close-modal:hover {
        color: #333;
    }
    
    h2 {
        margin-bottom: 25px;
        font-size: 28px;
        text-align: center;
    }
    
    .time-options {
        margin-bottom: 30px;
    }
    
    .time-option {
        display: flex;
        align-items: center;
        padding: 15px;
        border: 2px solid #eee;
        border-radius: 10px;
        margin-bottom: 15px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .time-option:hover {
        border-color: #ddd;
        background-color: #f9f9f9;
    }
    
    .time-option input[type="radio"] {
        margin-right: 10px;
        transform: scale(1.5);
    }
    
    .custom-time-inputs {
        margin-top: 15px;
        padding: 15px;
        background-color: #f9f9f9;
        border-radius: 10px;
    }
    
    .input-group {
        margin-bottom: 15px;
    }
    
    .input-group:last-child {
        margin-bottom: 0;
    }
    
    .input-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
    }
    
    .input-group input {
        width: 100%;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 16px;
    }
    
    .submit-btn {
        background-color: #C26C51FF;
        color: white;
        padding: 15px 30px;
        border: none;
        border-radius: 10px;
        width: 100%;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .submit-btn:hover:not([disabled]) {
        background-color: #a35a42;
    }
    
    .submit-btn:disabled {
        background-color: #ddd;
        cursor: not-allowed;
    }
    
    .error-message {
        color: #e74c3c;
        margin-bottom: 15px;
        text-align: center;
        font-size: 14px;
    }
</style>
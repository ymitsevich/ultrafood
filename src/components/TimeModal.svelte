<script>
    import { basket } from '../stores/basket.js';
    import { getContext } from 'svelte';
    import { language, t, i18n } from '../stores/language.js';
    
    // Get services from context with generic names
    const services = getContext('services') || {};
    const { database } = services;
    
    // Exported props
    export let showModal = false;
    export let onMealSubmitted = () => {}; // Callback when meal is submitted successfully
    export let showNotification = () => {}; // Callback to show notification

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
    
    // Helper functions for timestamp creation
    function getCurrentTimestamp() {
        return new Date().toISOString();
    }
    
    function getTimestampWithOffset(offsetMinutes) {
        const date = new Date();
        date.setMinutes(date.getMinutes() + offsetMinutes);
        return date.toISOString();
    }
    
    function getCustomTimestamp(date, time) {
        return new Date(`${date}T${time || '12:00'}`).toISOString();
    }
    
    // Get timestamp based on selected option
    function getTimestampForOption(timeOption) {
        switch (timeOption) {
            case 'now':
                return getCurrentTimestamp();
            case '20min':
                return getTimestampWithOffset(-20);
            case '1hour':
                return getTimestampWithOffset(-60);
            case 'custom':
                if (!customDate) {
                    throw new Error($i18n('selectDateError'));
                }
                return getCustomTimestamp(customDate, customTime);
            default:
                return getCurrentTimestamp();
        }
    }

    // Handle meal submission with specific time
    async function submitWithTime(timeOption) {
        // Early return if basket is empty
        if ($basket.length === 0) return;

        submissionInProgress = true;
        submissionError = null;

        try {
            // Get timestamp based on selected option
            let timestamp;
            try {
                timestamp = getTimestampForOption(timeOption);
            } catch (error) {
                submissionError = error.message;
                submissionInProgress = false;
                return;
            }

            // Make a deep copy of the basket items
            const basketItems = JSON.parse(JSON.stringify($basket));

            // Save the meal to database
            const mealId = await database.saveSubmittedMeal(basketItems, timestamp);
            
            if (!mealId) {
                submissionError = $i18n('errorSaving');
                return;
            }
            
            // Success path
            handleSuccessfulSubmission(timestamp);
            
        } catch (error) {
            console.error("Error submitting meal:", error);
            submissionError = $i18n('errorUnexpected');
        } finally {
            submissionInProgress = false;
        }
    }
    
    // Handle successful submission
    function handleSuccessfulSubmission(timestamp) {
        // Clear basket and close modal
        basket.clear();
        closeModal();
        
        // Call the callback to refresh submitted meals
        onMealSubmitted();

        // Show success notification
        showNotification($i18n('mealLoggedTime', {time: formatTimeForDisplay(timestamp)}), 'success');
    }
    
    // Format time for user display
    function formatTimeForDisplay(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString();
    }
    
    // Toggle custom time option
    function showCustomTimeInput() {
        selectedTime = 'custom';
    }
</script>

{#if showModal}
    <div class="modal" style="display: flex;">
        <div class="modal-content">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            
            <h2>{$i18n('whenDidYouEat')}</h2>
            
            <div class="time-options">
                <div class="time-buttons-grid">
                    <button class="time-btn" on:click={() => submitWithTime('now')}>
                        {$i18n('now')}
                    </button>
                    <button class="time-btn" on:click={() => submitWithTime('20min')}>
                        {$i18n('twentyMinAgo')}
                    </button>
                    <button class="time-btn" on:click={() => submitWithTime('1hour')}>
                        {$i18n('oneHourAgo')}
                    </button>
                    <button class="time-btn custom-time-btn" on:click={showCustomTimeInput}>
                        {$i18n('custom')}
                    </button>
                </div>
                
                {#if selectedTime === 'custom'}
                    <div class="custom-time-inputs">
                        <div class="input-group">
                            <label for="date-input">{$i18n('chooseDate')}:</label>
                            <input 
                                type="date" 
                                id="date-input"
                                bind:value={customDate}
                                max={today}
                            />
                        </div>
                        
                        <div class="input-group">
                            <label for="time-input">{$i18n('chooseTime')}:</label>
                            <input 
                                type="time" 
                                id="time-input"
                                bind:value={customTime}
                            />
                        </div>
                        
                        <button 
                            class="submit-btn custom-submit-btn" 
                            on:click={() => submitWithTime('custom')} 
                            disabled={submissionInProgress || !customDate}
                        >
                            {#if submissionInProgress}
                                {$i18n('submitting')}
                            {:else}
                                {$i18n('submit')}
                            {/if}
                        </button>
                    </div>
                {/if}
            </div>
            
            {#if submissionError}
                <p class="error-message">{submissionError}</p>
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
        margin-bottom: 20px;
    }
    
    .time-buttons-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 20px;
    }
    
    .time-btn {
        padding: 15px 10px;
        border: 2px solid #eee;
        border-radius: 10px;
        background-color: #f9f9f9;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        height: 60px;
    }
    
    .time-btn:hover {
        border-color: #C26C51FF;
        background-color: #fff;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .time-btn:active {
        transform: translateY(0);
    }
    
    .custom-time-btn {
        color: #C26C51FF;
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
    
    .input-group:last-of-type {
        margin-bottom: 20px;
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
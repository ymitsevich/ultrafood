<script>
    import { getContext } from 'svelte';
    import { language, t, i18n } from '../stores/language.js';
    
    // Get services from context
    const services = getContext('services') || {};
    const { database } = services;
    
    // Exported props
    export let showModal = false;
    export let showNotification = () => {}; // Callback to show notification

    // Local state
    let selectedDate = '';
    let isExporting = false;
    let exportError = null;

    // Get today's date as YYYY-MM-DD for default date input
    $: today = new Date().toISOString().split('T')[0];

    // Set today as default when modal opens
    $: if (showModal && !selectedDate) {
        selectedDate = today;
    }

    function closeModal() {
        showModal = false;
        selectedDate = '';
        exportError = null;
    }

    // Convert meal data to YAML format
    function convertToYaml(meals) {
        let yaml = `# Daily Meal Export - ${selectedDate}\n`;
        yaml += `date: "${selectedDate}"\n`;
        yaml += `meals:\n`;

        meals.forEach((meal, index) => {
            const mealTime = new Date(meal.timestamp);
            const timeString = mealTime.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            
            yaml += `  - time: "${timeString}"\n`;
            yaml += `    items:\n`;
            
            meal.items.forEach(item => {
                yaml += `      - name: "${item.name}"\n`;
                yaml += `        amount: "${item.amount}"\n`;
                if (item.calories) {
                    yaml += `        calories_per_100g: ${item.calories}\n`;
                }
            });
        });

        return yaml;
    }

    // Download YAML file
    function downloadYamlFile(yamlContent, filename) {
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    // Try to send to ChatGPT (if available)
    async function tryForwardToChatGPT(yamlContent) {
        try {
            // Check if ChatGPT is available (this is a basic check)
            if (navigator.share) {
                await navigator.share({
                    title: `Daily Meal Data - ${selectedDate}`,
                    text: yamlContent,
                });
                return true;
            }
            
            // Fallback: try to open ChatGPT web app with pre-filled text
            const chatGptUrl = `https://chat.openai.com/?q=${encodeURIComponent(
                `Please analyze this daily meal data:\n\n${yamlContent}`
            )}`;
            
            // Open in new tab
            window.open(chatGptUrl, '_blank');
            return true;
        } catch (error) {
            console.warn('Could not forward to ChatGPT:', error);
            return false;
        }
    }

    // Handle export
    async function handleExport() {
        if (!selectedDate) {
            exportError = $i18n('selectDateError');
            return;
        }

        if (!database.isAvailable()) {
            exportError = $i18n('localModeActive');
            return;
        }

        isExporting = true;
        exportError = null;

        try {
            // Get meals for the selected date
            const startOfDay = new Date(selectedDate + 'T00:00:00.000Z');
            const endOfDay = new Date(selectedDate + 'T23:59:59.999Z');
            
            // Get all meals (we'll filter on client side for simplicity)
            const { meals } = await database.exportCollections();
            
            // Filter meals for the selected date
            const dailyMeals = meals.filter(meal => {
                const mealDate = new Date(meal.timestamp);
                return mealDate >= startOfDay && mealDate <= endOfDay;
            });

            if (dailyMeals.length === 0) {
                exportError = $i18n('noMealsForDate');
                return;
            }

            // Sort meals by timestamp
            dailyMeals.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            // Convert to YAML
            const yamlContent = convertToYaml(dailyMeals);
            const filename = `meals-${selectedDate}.yaml`;

            // Try to forward to ChatGPT first
            const forwardedToChatGPT = await tryForwardToChatGPT(yamlContent);
            
            if (forwardedToChatGPT) {
                showNotification($i18n('exportForwardedToChatGPT'), 'success');
            } else {
                // Fallback to download
                downloadYamlFile(yamlContent, filename);
                showNotification($i18n('exportDownloaded').replace('{filename}', filename), 'success');
            }

            closeModal();

        } catch (error) {
            console.error('Error exporting daily meals:', error);
            exportError = $i18n('errorExporting');
        } finally {
            isExporting = false;
        }
    }
</script>

{#if showModal}
    <div class="modal" style="display: flex;">
        <div class="modal-content">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            
            <h2>{$i18n('dailyMealExport')}</h2>
            
            <div class="form-group">
                <label for="export-date">{$i18n('selectDate')}:</label>
                <input
                    id="export-date"
                    type="date"
                    bind:value={selectedDate}
                    max={today}
                />
            </div>
            
            {#if exportError}
                <div class="error-message">{exportError}</div>
            {/if}
            
            <div class="actions">
                <button class="cancel-btn" on:click={closeModal} disabled={isExporting}>
                    {$i18n('cancel')}
                </button>
                <button
                    class="export-btn"
                    on:click={handleExport}
                    disabled={isExporting || !selectedDate}
                >
                    {#if isExporting}
                        {$i18n('exporting')}
                    {:else}
                        📤 {$i18n('exportMeals')}
                    {/if}
                </button>
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
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal-content {
        background-color: white;
        width: 90%;
        max-width: 400px;
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
        font-size: 24px;
        text-align: center;
        color: #333;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #555;
    }
    
    .form-group input[type="date"] {
        width: 100%;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 16px;
        box-sizing: border-box;
    }
    
    .form-group input[type="date"]:focus {
        border-color: #C26C51;
        outline: none;
    }
    
    .actions {
        display: flex;
        gap: 12px;
        margin-top: 25px;
    }
    
    .cancel-btn, .export-btn {
        flex: 1;
        padding: 12px 20px;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .cancel-btn {
        background-color: #f5f5f5;
        color: #666;
    }
    
    .cancel-btn:hover:not([disabled]) {
        background-color: #e5e5e5;
    }
    
    .export-btn {
        background-color: #C26C51;
        color: white;
    }
    
    .export-btn:hover:not([disabled]) {
        background-color: #a35a42;
    }
    
    .export-btn:disabled, .cancel-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .error-message {
        color: #e74c3c;
        margin: 15px 0;
        text-align: center;
        font-size: 14px;
        padding: 10px;
        background-color: #fef5f5;
        border-radius: 6px;
        border: 1px solid #f8d7da;
    }
</style>
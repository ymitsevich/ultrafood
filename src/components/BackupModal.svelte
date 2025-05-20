<script>
    import { language, t, i18n } from '../stores/language.js';
    
    // Props: modal control, loading state and results
    export let show = false;
    export let isLoading = false;
    export let result = null;
    
    // Handle close event
    function handleClose() {
        show = false;
    }
    
    // Format date from ISO string to localized format
    function formatDate(dateStr) {
        try {
            const date = new Date(dateStr.replace('backup_', ''));
            // Get current language and select appropriate locale
            let currentLang;
            language.subscribe(value => {
                currentLang = value;
            })();
            
            // Map language code to locale
            const localeMap = {
                'en': 'en-US',
                'ru': 'ru-RU'
            };
            
            return date.toLocaleDateString(localeMap[currentLang] || 'en-US');
        } catch (e) {
            return dateStr;
        }
    }
</script>

<!-- Modal backdrop -->
<div class="modal-backdrop" class:show={show} on:click={handleClose}></div>

<!-- Modal container -->
<div class="modal-container" class:show={show}>
    <div class="modal-content">
        <div class="modal-header">
            <h3>
                {$i18n('dataBackup')}
            </h3>
            <button class="close-button" on:click={handleClose}>×</button>
        </div>
        
        <div class="modal-body">
            {#if isLoading}
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>{$i18n('creatingBackup')}</p>
                </div>
            {:else if result}
                {#if result.success}
                    <div class="success-state">
                        <div class="success-icon">✓</div>
                        <p>{$i18n('backupCompleted')}</p>
                        <div class="backup-details">
                            <p>
                                <strong>{$i18n('backupPrefix')}</strong> {formatDate(result.prefix)}
                            </p>
                            <p>
                                <strong>{$i18n('foodItems')}</strong> {result.foodItemsCount}
                            </p>
                            <p>
                                <strong>{$i18n('meals')}</strong> {result.mealsCount}
                            </p>
                        </div>
                    </div>
                {:else}
                    <div class="error-state">
                        <div class="error-icon">✗</div>
                        <p>{$i18n('backupFailed')}</p>
                        {#if result.message}
                            <p class="error-message">{result.message}</p>
                        {/if}
                    </div>
                {/if}
            {:else}
                <p>
                    {$i18n('cloudStorageHint')}
                </p>
            {/if}
        </div>
        
        <div class="modal-footer">
            {#if !isLoading}
                <button class="primary-button" on:click={handleClose}>
                    {$i18n('cancel')}
                </button>
            {/if}
        </div>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 90;
        display: none;
    }
    
    .modal-backdrop.show {
        display: block;
    }
    
    .modal-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    
    .modal-container.show {
        opacity: 1;
        pointer-events: auto;
    }
    
    .modal-content {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #eee;
    }
    
    .modal-header h3 {
        margin: 0;
        font-size: 1.2rem;
    }
    
    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    
    .modal-body {
        padding: 16px;
    }
    
    .modal-footer {
        padding: 12px 16px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
    }
    
    .primary-button {
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
    }
    
    .primary-button:hover {
        background-color: #388e3c;
    }
    
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
    }
    
    .spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 4px solid #4caf50;
        width: 40px;
        height: 40px;
        margin-bottom: 16px;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .success-state, .error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 16px;
    }
    
    .success-icon, .error-icon {
        font-size: 2.5rem;
        margin-bottom: 8px;
    }
    
    .success-icon {
        color: #4caf50;
    }
    
    .error-icon {
        color: #f44336;
    }
    
    .backup-details {
        width: 100%;
        margin-top: 16px;
        border-top: 1px solid #eee;
        padding-top: 16px;
    }
    
    .backup-details p {
        margin: 8px 0;
    }
    
    .error-message {
        color: #f44336;
        font-style: italic;
        margin-top: 8px;
        text-align: center;
    }
</style>
<script>
    import { language, languages, translations, i18n } from '../stores/language.js';

    // Props for controlling modal visibility
    export let showModal = false;

    // Current language state from store
    let selectedLanguage;
    
    // Subscribe to language store and update local state
    language.subscribe(value => {
        selectedLanguage = value;
    });

    // Close the modal
    function closeModal() {
        showModal = false;
    }

    // Apply selected language and close modal
    function applyLanguage() {
        if (!selectedLanguage) return;
        
        language.set(selectedLanguage);
        closeModal();
    }
</script>

<div class="modal" class:active={showModal}>
    <div class="modal-content language-modal">
        <span class="close-modal" on:click={closeModal}>&times;</span>
        <h2>{$i18n('languageSettings')}</h2>
        
        <div class="form-group">
            <label for="language-select">{$i18n('selectLanguage')}</label>
            <select id="language-select" bind:value={selectedLanguage}>
                {#each Object.entries(languages) as [code, name]}
                    <option value={code}>{name}</option>
                {/each}
            </select>
        </div>
        
        <div class="form-actions">
            <button class="cancel-btn" on:click={closeModal}>
                {$i18n('cancel')}
            </button>
            <button class="save-btn" on:click={applyLanguage}>
                {$i18n('applyLanguage')}
            </button>
        </div>
    </div>
</div>

<style>
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal.active {
        display: flex;
    }

    .modal-content {
        background: white;
        padding: 20px;
        border-radius: 12px;
        max-width: 90%;
        max-height: 90%;
        overflow-y: auto;
        position: relative;
    }

    .language-modal {
        width: 400px;
        max-width: 90vw;
    }

    .close-modal {
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 24px;
        cursor: pointer;
        color: #999;
    }

    .close-modal:hover {
        color: #333;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
    }

    .form-group select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 16px;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }

    .cancel-btn, .save-btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        border: none;
    }

    .cancel-btn {
        background-color: #f5f5f5;
    }

    .save-btn {
        background-color: #C26C51;
        color: white;
    }
</style>
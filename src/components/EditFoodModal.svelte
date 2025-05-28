<script>
    import { onMount, getContext } from "svelte";
    import { generateFoodId } from "../utils.js";
    import PixabayImageSearch from "./PixabayImageSearch.svelte";
    import { language, t, i18n } from "../stores/language.js";

    // Get services from context with generic names
    const services = getContext('services') || {};
    const { database, imageHosting, imageSearch } = services;
    
    // Extract specific functions from services using the new interface method names
    const { uploadImage, centerObject, enhanceImage } = imageHosting || {};
    const { saveFoodItem, deleteFoodItem } = database || {};
    const { fetchImageAsBlob } = imageSearch || {};

    // Exported props
    export let showModal = false;
    export let foodItem = null;
    export let onSave = () => {};
    export let onDelete = () => {};
    export let availableTags = []; // Available tags for selection

    // Local state
    let foodName = "";
    let imageSearchQuery = ""; 
    let selectedTags = []; // Array of selected tags for this food item
    let calories = "";
    let fileInput;
    let nameInput;
    let imageData = null;
    let imageBlob = null;
    let isUploading = false;
    let uploadError = null;
    let selectedPixabayImage = null;
    let confirmDeleteMode = false;
    let initialized = false;
    let lastFoodItemId = null;
    let newTagInput = ""; // For adding new tags
    
    // Sanitize a string to be used as a filename or ID
    // Removes or replaces special characters that could cause problems in URLs or APIs
    function sanitizeFilename(name) {
        if (!name) return "";
        // Replace special characters with underscores
        return name.trim()
            .replace(/[&+/\\#,+()$~%'":*?<>{}]/g, '_')
            .replace(/\s+/g, '_');
    }
    
    // Initialize form when modal opens or food item changes
    $: if (shouldInitializeForm(showModal, foodItem, initialized, lastFoodItemId)) {
        initializeForm();
    }
    
    // Check if the form should be initialized
    function shouldInitializeForm(isModalShown, food, isInitialized, lastId) {
        return isModalShown && food && (!isInitialized || lastId !== food.id);
    }
    
    // Initialize form with food item data
    function initializeForm() {
        if (!foodItem) return;
        
        console.log("Initializing edit modal with food item:", foodItem);
        
        // Initialize form fields
        foodName = foodItem.name || "";
        imageSearchQuery = foodItem.name || "";
        
        // Initialize selected tags from tags array
        if (foodItem.tags && Array.isArray(foodItem.tags) && foodItem.tags.length > 0) {
            selectedTags = [...foodItem.tags];
        } else {
            selectedTags = [];
        }
        
        calories = foodItem.calories || "";
        imageData = null;
        // Reset imageBlob only if we're not in the middle of an edit session
        imageBlob = null;
        
        // Set the image if available
        if (foodItem.imageUrl || foodItem.image) {
            selectedPixabayImage = { 
                id: foodItem.id, 
                smallImageUrl: foodItem.imageUrl || foodItem.image,
                thumbnailUrl: foodItem.imageUrl || foodItem.image
            };
        } else {
            selectedPixabayImage = null;
        }
        
        confirmDeleteMode = false;
        
        // Mark as initialized and store the food item ID
        initialized = true;
        lastFoodItemId = foodItem.id;
    }
    
    // When modal is closed, reset the initialization flag
    $: if (!showModal) {
        initialized = false;
    }

    // Reset modal form to initial state
    function resetForm() {
        foodName = "";
        imageSearchQuery = "";
        selectedTags = [];
        newTagInput = "";
        calories = "";
        imageData = null;
        imageBlob = null;
        isUploading = false;
        uploadError = null;
        selectedPixabayImage = null;
        confirmDeleteMode = false;
        initialized = false;
        lastFoodItemId = null;
    }

    // Close the modal and reset the form
    function closeModal() {
        showModal = false;
        resetForm();
    }

    // Update image search based on the current food name
    function updateImageSearch() {
        imageSearchQuery = foodName;
    }

    // Handle pixabay image selection from child component
    function handlePixabayImageSelect(image) {
        selectedPixabayImage = image;
        console.log("Selected Pixabay image:", image);
    }

    // Handle image file selection
    async function handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Show original image while processing
            imageData = await readFileAsDataURL(file);
                
            // Process the image (resize and compress)
            imageBlob = await resizeAndCompressImage(file);
            
            // Update preview with processed image
            imageData = await readFileAsDataURL(imageBlob);
            
            // Reset the selected Pixabay image if user uploads their own
            selectedPixabayImage = null;
        } catch (error) {
            console.error("Error processing image:", error);
            uploadError = "Failed to process the image";
        }
    }
    
    // Read file as data URL for preview
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }
    
    // Resize, crop to square, and compress an image file
    async function resizeAndCompressImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                
                // Size configuration
                const TARGET_SIZE = 500;
                const FINAL_SIZE = 500;
                
                // Calculate crop dimensions
                const cropData = getCropDimensions(img.width, img.height);
                
                // Create canvas for cropping and resizing
                const canvas = document.createElement('canvas');
                canvas.width = FINAL_SIZE;
                canvas.height = FINAL_SIZE;
                
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Draw the image cropped and resized
                ctx.drawImage(
                    img,
                    cropData.sourceX, cropData.sourceY, cropData.sourceSize, cropData.sourceSize,
                    0, 0, FINAL_SIZE, FINAL_SIZE
                );
                
                // Convert to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                }, 'image/jpeg', 0.8);  // Good quality JPEG
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image'));
            };
            
            img.src = objectUrl;
        });
    }
    
    // Calculate dimensions for cropping to square
    function getCropDimensions(width, height) {
        if (width > height) {
            // Landscape image
            const sourceSize = height;
            const sourceX = Math.floor((width - sourceSize) / 2);
            const sourceY = 0;
            return { sourceX, sourceY, sourceSize };
        } else {
            // Portrait image
            const sourceSize = width;
            const sourceX = 0;
            const sourceY = Math.floor((height - sourceSize) / 2);
            return { sourceX, sourceY, sourceSize };
        }
    }

    // Handle form submission
    async function handleSubmit() {
        if (!foodName.trim()) {
            nameInput.focus();
            return;
        }

        isUploading = true;
        uploadError = null;

        try {
            const imageUrl = await processAndUploadImage();
            
            if (!imageUrl) {
                throw new Error("Failed to process image");
            }

            // Create the updated food item
            const updatedFood = createUpdatedFoodItem(imageUrl);

            // Save the food item to Firebase
            await saveFoodItem(updatedFood);
            
            // Notify parent component and close modal
            if (onSave) onSave(updatedFood);
            closeModal();
            
        } catch (error) {
            console.error("Error saving food item:", error);
            uploadError = "Failed to save food item";
        } finally {
            isUploading = false;
        }
    }
    
    // Process and upload the selected image
    async function processAndUploadImage() {
        // Default to existing image URL
        let imageUrl = foodItem.imageUrl || foodItem.image;
        
        console.log("=== processAndUploadImage DEBUG ===");
        console.log("imageBlob:", imageBlob);
        console.log("selectedPixabayImage:", selectedPixabayImage);
        console.log("foodItem.imageUrl:", foodItem.imageUrl);
        console.log("foodItem.image:", foodItem.image);
        
        try {
            // Check if user uploaded a local image file
            if (imageBlob) {
                // User uploaded a local image
                console.log("Uploading local image blob, size:", imageBlob.size, "type:", imageBlob.type);
                imageUrl = await uploadImage(imageBlob, foodItem.id);
                console.log("New image URL from local upload:", imageUrl);
            } 
            // Check if user selected a different Pixabay image
            else if (selectedPixabayImage && selectedPixabayImage.smallImageUrl !== (foodItem.imageUrl || foodItem.image)) {
                // User selected a new Pixabay image (different from current one)
                console.log("Uploading new Pixabay image");
                console.log("selectedPixabayImage.smallImageUrl:", selectedPixabayImage.smallImageUrl);
                console.log("Current food image URL:", foodItem.imageUrl || foodItem.image);
                const smallImageUrl = selectedPixabayImage.smallImageUrl || selectedPixabayImage.previewURL;
                imageBlob = await fetchImageAsBlob(smallImageUrl);
                console.log("Fetched Pixabay image as blob, size:", imageBlob.size, "type:", imageBlob.type);
                imageUrl = await uploadImage(imageBlob, foodItem.id);
                console.log("New image URL from Pixabay:", imageUrl);
            } else {
                // No new image selected, keeping existing URL
                console.log("No new image detected, keeping existing URL:", imageUrl);
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            throw new Error("Failed to upload image: " + error.message);
        }
        
        console.log("=== END DEBUG ===");
        return imageUrl;
    }
    
    // Create updated food item object
    function createUpdatedFoodItem(imageUrl) {
        return {
            id: foodItem.id,
            name: foodName.trim(),
            tags: selectedTags,
            image: imageUrl,
            imageUrl: imageUrl,
            calories: calories ? parseInt(calories, 10) : null,
        };
    }

    // Handle delete confirmation
    function handleDeleteConfirmation() {
        confirmDeleteMode = !confirmDeleteMode;
        
        if (confirmDeleteMode) {
            // Don't automatically delete, just enter confirmation mode
            return;
        }
    }

    // Handle delete
    async function handleDelete() {
        if (!foodItem || !foodItem.id) return;

        try {
            await deleteFoodItem(foodItem.id);
            
            // Notify parent component
            if (onDelete) onDelete(foodItem.id);
            
            // Close the modal
            closeModal();
        } catch (error) {
            console.error("Error deleting food item:", error);
            uploadError = "Failed to delete food item";
        }
    }
    
    // Add a new tag from input
    function addTag() {
        if (!newTagInput.trim()) return;
        
        // Convert to lowercase and replace spaces with underscores for consistency
        const tagKey = newTagInput.trim().toLowerCase().replace(/\s+/g, '_');
        
        // Add only if it doesn't already exist in selected tags
        if (!selectedTags.includes(tagKey)) {
            selectedTags = [...selectedTags, tagKey];
        }
        
        // Reset input
        newTagInput = "";
    }
    
    // Remove a tag
    function removeTag(tag) {
        selectedTags = selectedTags.filter(t => t !== tag);
    }
    
    // Handle keydown in the tag input (add tag on Enter)
    function handleTagInputKeydown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addTag();
        }
    }

    // Focus on the name input when the modal is opened
    $: if (showModal && nameInput) {
        setTimeout(() => nameInput.focus(), 100);
    }
</script>

{#if showModal && foodItem}
    <div class="modal" style="display: flex;">
        <div class="modal-content">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            
            <h2>{$i18n('editFood')}</h2>
            
            <div class="form-group">
                <label for="food-name">{$i18n('foodName')}:</label>
                <input
                    id="food-name"
                    type="text"
                    bind:value={foodName}
                    bind:this={nameInput}
                    placeholder={$i18n('foodName')}
                />
                <button 
                    type="button" 
                    class="search-with-name-btn" 
                    on:click={updateImageSearch}
                    title={$i18n('searchImage')}
                >
                    🔍
                </button>
            </div>
            
            <!-- Tags input section -->
            <div class="form-group">
                <label>{$i18n('tags')}:</label>
                
                <!-- Selected tags display as pills -->
                <div class="tags-container">
                    {#each selectedTags as tag}
                        <div class="tag-pill">
                            <span class="tag-text">{tag}</span>
                            <button class="tag-remove" on:click={() => removeTag(tag)}>×</button>
                        </div>
                    {/each}
                    
                    <!-- Inline tag input -->
                    <div class="inline-tag-input">
                        <input
                            type="text"
                            placeholder={selectedTags.length ? "" : $i18n('addNewTag')}
                            bind:value={newTagInput}
                            on:keydown={handleTagInputKeydown}
                        />
                    </div>
                </div>
                
                <!-- Quick tag selection from available tags -->
                <div class="quick-tags-container">
                    <div class="quick-tags">
                        {#each availableTags.filter(tag => !selectedTags.includes(tag)) as tag}
                            <button 
                                class="quick-tag-btn" 
                                on:click={() => {
                                    selectedTags = [...selectedTags, tag];
                                }}
                            >
                                {tag}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="food-calories">{$i18n('calories')}:</label>
                <input
                    id="food-calories"
                    type="number"
                    bind:value={calories}
                    placeholder={$i18n('enterCalories')}
                    min="0"
                    step="1"
                />
            </div>
            
            <!-- Current image display -->
            {#if (foodItem.imageUrl || foodItem.image) && !imageData && !selectedPixabayImage}
                <div class="current-image">
                    <div class="preview-label">{$i18n('currentImage')}:</div>
                    <div class="image-preview">
                        <img src={foodItem.imageUrl || foodItem.image} alt={foodItem.name} />
                    </div>
                </div>
            {/if}
            
            <!-- Pixabay image search component using the separate search query -->
            <PixabayImageSearch 
                searchQuery={imageSearchQuery} 
                onImageSelect={handlePixabayImageSelect}
                selectedImage={selectedPixabayImage}
            />
            
            <!-- Hidden file input for uploading custom images -->
            <input
                type="file"
                accept="image/*"
                on:change={handleImageSelect}
                bind:this={fileInput}
                style="display: none"
            />
            
            <div class="upload-button-container">
                <button type="button" class="upload-btn" on:click={() => fileInput.click()}>
                    {$i18n('uploadImage')}
                </button>
            </div>
            
            {#if imageData}
                <div class="custom-image-preview">
                    <div class="preview-label">{$i18n('newCustomImage')}:</div>
                    <div class="image-preview">
                        <img src={imageData} alt="Food preview" />
                    </div>
                </div>
            {/if}
            
            {#if uploadError}
                <div class="error-message">{uploadError}</div>
            {/if}
            
            <div class="actions">
                <div class="left-actions">
                    {#if !confirmDeleteMode}
                        <button type="button" on:click={handleDeleteConfirmation} class="delete-btn">
                            {$i18n('deleteFood')}
                        </button>
                    {:else}
                        <button type="button" on:click={handleDelete} class="confirm-delete-btn">
                            {$i18n('confirmDelete')}
                        </button>
                        <button type="button" on:click={() => confirmDeleteMode = false} class="cancel-delete-btn">
                            {$i18n('cancel')}
                        </button>
                    {/if}
                </div>
                <div class="right-actions">
                    <button type="button" on:click={closeModal} class="cancel-btn">
                        {$i18n('cancel')}
                    </button>
                    <button
                        type="button"
                        on:click={handleSubmit}
                        class="submit-btn"
                        disabled={isUploading || !foodName.trim() || confirmDeleteMode}
                    >
                        {isUploading ? $i18n('saving') : $i18n('save')}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Modal styles */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background-color: white;
        border-radius: 8px;
        padding: 24px;
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    }

    h2 {
        margin-top: 0;
        margin-bottom: 20px;
        text-align: center;
        color: #333;
    }

    .close-modal {
        position: absolute;
        top: 16px;
        right: 16px;
        font-size: 24px;
        cursor: pointer;
    }

    /* Form styles */
    .form-group {
        margin-bottom: 16px;
        position: relative;
    }

    .form-group label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #555;
    }

    input[type="text"], input[type="number"], select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
    }
    
    select {
        height: 40px;
        background-color: white;
    }
    
    .current-image,
    .custom-image-preview {
        margin: 12px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .preview-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
    }
    
    .upload-button-container {
        display: flex;
        justify-content: center;
        margin: 8px 0;
    }
    
    .image-preview {
        width: 120px;
        height: 120px;
        border: 2px solid #3498db;
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .image-preview img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }

    .upload-btn {
        padding: 8px 16px;
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
    }

    .upload-btn:hover {
        background-color: #eee;
    }

    .error-message {
        color: #e74c3c;
        margin-top: 8px;
        margin-bottom: 16px;
        text-align: center;
    }

    /* Button styles */
    .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;
    }
    
    .left-actions, .right-actions {
        display: flex;
        gap: 8px;
    }

    .submit-btn {
        padding: 10px 20px;
        background-color: #3498db;
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
    }

    .submit-btn:disabled {
        background-color: #95a5a6;
        cursor: not-allowed;
    }

    .cancel-btn {
        padding: 10px 20px;
        background-color: transparent;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
    }

    .cancel-btn:hover {
        background-color: #f5f5f5;
    }
    
    .delete-btn {
        padding: 10px 20px;
        background-color: transparent;
        border: 1px solid #e74c3c;
        border-radius: 4px;
        color: #e74c3c;
        cursor: pointer;
    }
    
    .delete-btn:hover {
        background-color: #fef5f5;
    }
    
    .confirm-delete-btn {
        padding: 10px 20px;
        background-color: #e74c3c;
        border: none;
        border-radius: 4px;
        color: white;
        cursor: pointer;
    }
    
    .cancel-delete-btn {
        padding: 10px 20px;
        background-color: transparent;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
    }

    /* New styles for the search button */
    .search-with-name-btn {
        position: absolute;
        right: 10px;
        top: 34px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: background-color 0.2s;
    }
    
    .search-with-name-btn:hover {
        background-color: #f0f0f0;
    }
    
    /* New tag-related styles */
    .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
        padding: 5px 0;
    }
    
    .tag-pill {
        display: flex;
        align-items: center;
        background-color: #e1f5fe;
        border-radius: 16px;
        padding: 5px 10px;
        font-size: 14px;
    }
    
    .tag-text {
        margin-right: 5px;
    }
    
    .tag-remove {
        background: none;
        border: none;
        color: #555;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        padding: 0 3px;
        line-height: 1;
    }
    
    .inline-tag-input {
        flex: 1;
        display: flex;
        align-items: center;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 16px;
        padding: 5px 10px;
        margin-left: 8px;
    }
    
    .inline-tag-input input {
        border: none;
        background: transparent;
        outline: none;
        flex: 1;
        padding: 0;
        margin: 0;
    }
    
    .quick-tags-container {
        max-height: 40px;
        overflow-x: auto;
        padding: 4px 0;
        margin-top: 8px;
    }
    
    .quick-tags {
        display: flex;
        flex-wrap: nowrap;
        gap: 6px;
    }
    
    .quick-tag-btn {
        background-color: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 16px;
        padding: 4px 10px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .quick-tag-btn:hover {
        background-color: #e1f5fe;
        border-color: #81d4fa;
    }
</style>
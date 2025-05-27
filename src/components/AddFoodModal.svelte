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
    const { saveFoodItem } = database || {};
    const { fetchImageAsBlob } = imageSearch || {};

    // Exported props
    export let showModal = false;
    export let currentTag = ""; // Current tag to pre-select
    export let onAddFood;
    export let availableTags = []; // Available tags from the tags collection

    // Local state
    let foodName = "";
    let calories = "";
    let fileInput;
    let nameInput;
    let imageData = null;
    let imageBlob = null;
    let isUploading = false;
    let uploadError = null;
    let selectedPixabayImage = null;
    let selectedTags = [];
    let newTagInput = "";

    // Image resize configuration
    const IMAGE_CONFIG = {
        maxFileSizeKB: 50,
        initialQuality: 0.7,
        minQuality: 0.1,
        compressionStep: 0.1,
    };
    
    // Reset modal form to initial state
    function resetForm() {
        foodName = "";
        calories = "";
        imageData = null;
        imageBlob = null;
        isUploading = false;
        uploadError = null;
        selectedPixabayImage = null;
        selectedTags = [];
        newTagInput = "";
    }

    // Close the modal and reset the form
    function closeModal() {
        showModal = false;
        resetForm();
    }

    // Handle pixabay image selection from child component
    function handlePixabayImageSelect(image) {
        selectedPixabayImage = image;
        console.log("Selected Pixabay image:", image);
    }

    // Handle image file selection with resizing and compression
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
    
    // Resize and compress an image file
    async function resizeAndCompressImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                
                // Get dimensions for square cropping
                const cropData = getCropDimensions(img.width, img.height);
                
                // Create canvas for resizing
                const canvas = document.createElement('canvas');
                canvas.width = 500;  // Target size
                canvas.height = 500; // Target size
                
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Draw the cropped image
                ctx.drawImage(
                    img, 
                    cropData.sourceX, 
                    cropData.sourceY, 
                    cropData.sourceSize, 
                    cropData.sourceSize,
                    0, 0, canvas.width, canvas.height
                );
                
                // Convert to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create image blob'));
                    }
                }, 'image/jpeg', 0.85); // Use JPEG for best compression
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

    // Add a new tag
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
    
    // Add an existing tag from available tags
    function addExistingTag(tag) {
        if (!selectedTags.includes(tag)) {
            selectedTags = [...selectedTags, tag];
        }
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

    // Handle form submission
    async function handleSubmit() {
        if (!foodName.trim()) {
            // Focus on name input if empty
            nameInput.focus();
            return;
        }

        // If no image is selected from file or Pixabay, focus on file input
        if (!imageData && !selectedPixabayImage) {
            fileInput.click();
            return;
        }

        isUploading = true;
        uploadError = null;

        try {
            // If using a Pixabay image, fetch it as a blob
            if (selectedPixabayImage && !imageBlob) {
                // Use the smallest image URL available (thumbnailUrl or previewURL)
                const smallImageUrl = selectedPixabayImage.thumbnailUrl || selectedPixabayImage.previewURL || selectedPixabayImage.smallImageUrl;
                imageBlob = await fetchImageAsBlob(smallImageUrl);
            }

            if (!imageBlob) {
                throw new Error("No image selected");
            }

            // Upload the image to Cloudinary
            const imageUrl = await uploadImage(imageBlob, foodName);
            
            if (!imageUrl) {
                throw new Error("Failed to upload image");
            }

            // Generate a food ID based on the name
            const foodId = generateFoodId(foodName.trim());
            console.log(`Generated food ID: ${foodId} for "${foodName}"`);
            
            // Create the food item with tags-based structure
            const newFood = {
                id: foodId,
                name: foodName.trim(),
                tags: selectedTags, // Use tags array for categorization
                image: imageUrl,
                calories: calories ? parseInt(calories, 10) : null,
            };

            // Save the food item to Firebase
            const savedId = await saveFoodItem(newFood);
            
            // Update the ID if Firebase returned one
            if (savedId && savedId !== foodId) {
                console.log(`Firebase changed ID from ${foodId} to ${savedId}`);
                newFood.id = savedId;
            }
            
            // Notify parent component
            if (onAddFood) onAddFood(newFood);
            
            // Close the modal and reset form
            closeModal();
            
        } catch (error) {
            console.error("Error saving food item:", error);
            uploadError = "Failed to save food item";
        } finally {
            isUploading = false;
        }
    }

    // Focus on the name input when the modal is opened
    $: if (showModal && nameInput) {
        setTimeout(() => nameInput.focus(), 100);
    }

    // Auto-select current tag when modal opens
    $: if (showModal && currentTag && currentTag !== 'recent' && !selectedTags.includes(currentTag)) {
        selectedTags = [currentTag];
    }
</script>

{#if showModal}
    <div class="modal" style="display: flex;">
        <div class="modal-content">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            
            <h2>{$i18n('addFood')}</h2>
            
            <div class="form-group">
                <label for="food-name">{$i18n('foodName')}</label>
                <input
                    id="food-name"
                    type="text"
                    bind:this={nameInput}
                    bind:value={foodName}
                    placeholder="Enter food name"
                />
            </div>
            
            <div class="form-group">
                <label for="food-calories">{$i18n('calories')}</label>
                <input
                    id="food-calories"
                    type="number"
                    bind:value={calories}
                    placeholder="Calories per 100g"
                    min="0"
                    step="1"
                />
            </div>
            
            <!-- NEW: Tags section with improved UX -->
            <div class="form-group">
                <label>{$i18n('tags')}:</label>
                
                <!-- Selected tags display as pills with inline input -->
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
                                on:click={() => addExistingTag(tag)}
                            >
                                {tag}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>
            
            <!-- Pixabay image search component - pass selectedImage prop to persist selection -->
            <PixabayImageSearch 
                searchQuery={foodName} 
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
                    Upload Custom Image
                </button>
            </div>
            
            {#if imageData}
                <div class="custom-image-preview">
                    <div class="preview-label">Custom Image:</div>
                    <div class="image-preview">
                        <img src={imageData} alt="Food preview" />
                    </div>
                </div>
            {/if}
            
            {#if uploadError}
                <div class="error-message">{uploadError}</div>
            {/if}
            
            <div class="actions">
                <button type="button" on:click={closeModal} class="cancel-btn">
                    Cancel
                </button>
                <button
                    type="button"
                    on:click={handleSubmit}
                    class="submit-btn"
                    disabled={isUploading || !foodName.trim()}
                >
                    {isUploading ? 'Saving...' : 'Add Food'}
                </button>
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
    }

    input[type="text"], input[type="number"] {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
    }
    
    .upload-button-container {
        display: flex;
        justify-content: center;
        margin: 8px 0;
    }

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
    }

    /* Button styles */
    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
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
    
    /* Tags-related styles */
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

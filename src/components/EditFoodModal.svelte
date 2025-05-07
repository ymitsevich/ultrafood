<script>
    import { onMount } from "svelte";
    import {
        uploadFoodImage,
        centerObject,
        enhanceImage,
    } from "../cloudinary.js";
    import { saveFoodItem, deleteFoodItem } from "../firebase.js";
    import { fetchImageAsBlob } from "../pixabay.js";
    import { generateFoodId } from "../utils.js";
    import PixabayImageSearch from "./PixabayImageSearch.svelte";

    // Exported props
    export let showModal = false;
    export let foodItem = null;
    export let onSave;
    export let onDelete;
    export let categories = [];

    // Local state
    let foodName = "";
    let imageSearchQuery = ""; 
    let selectedCategory = "";
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
    
    // Only initialize the form when the modal opens or a different food item is provided
    $: if (showModal && foodItem && (!initialized || lastFoodItemId !== foodItem.id)) {
        console.log("Initializing edit modal with food item:", foodItem);
        
        // Initialize form fields
        foodName = foodItem.name || "";
        imageSearchQuery = foodItem.name || "";
        selectedCategory = foodItem.category || "";
        imageData = null;
        
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
        selectedCategory = "";
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

    // Update image search based on the current food name (only when requested)
    function updateImageSearch() {
        imageSearchQuery = foodName;
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
            // Create a preview of the original image first
            const reader = new FileReader();
            reader.onload = async (e) => {
                // Show original image while processing
                imageData = e.target.result;
                
                // Process the image (resize and compress)
                const processedBlob = await resizeAndCompressImage(file);
                imageBlob = processedBlob;
                
                // Update the preview with the processed image
                const processedReader = new FileReader();
                processedReader.onload = (pe) => {
                    imageData = pe.target.result;
                };
                processedReader.readAsDataURL(processedBlob);
            };
            reader.readAsDataURL(file);
            
            // Reset the selected Pixabay image if user uploads their own
            selectedPixabayImage = null;
        } catch (error) {
            console.error("Error processing image:", error);
            uploadError = "Failed to process the image";
        }
    }
    
    // Resize, crop to square, and compress an image file
    async function resizeAndCompressImage(file) {
        return new Promise((resolve, reject) => {
            // Create an image to get dimensions
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            
            img.onload = () => {
                // Clean up object URL
                URL.revokeObjectURL(objectUrl);
                
                // Size configuration
                const TARGET_SIZE = 500; // Target size for the square image
                const FINAL_SIZE = 500;  // Final output size
                
                // Calculate dimensions for cropping to a square
                let sourceX, sourceY, sourceSize;
                
                if (img.width > img.height) {
                    // Landscape image - crop from center width
                    sourceSize = img.height;
                    sourceX = Math.floor((img.width - sourceSize) / 2);
                    sourceY = 0;
                } else {
                    // Portrait image - crop from center height
                    sourceSize = img.width;
                    sourceX = 0;
                    sourceY = Math.floor((img.height - sourceSize) / 2);
                }
                
                // Create canvas for cropping and resizing
                const canvas = document.createElement('canvas');
                canvas.width = FINAL_SIZE;
                canvas.height = FINAL_SIZE;
                
                // Draw the cropped and resized image on canvas
                const ctx = canvas.getContext('2d');
                
                // Apply some basic anti-aliasing by setting the smoothing quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Draw the image with cropping and resizing
                ctx.drawImage(
                    img,
                    sourceX, sourceY,       // Source position (x, y) - where to start cropping
                    sourceSize, sourceSize, // Source dimensions - the square to crop
                    0, 0,                   // Destination position (always 0,0)
                    FINAL_SIZE, FINAL_SIZE  // Destination size - our final square size
                );
                
                // Convert to blob with compression
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            console.log(`Image optimized: ${Math.round(blob.size / 1024)}KB (${FINAL_SIZE}x${FINAL_SIZE}px, square)`);
                            resolve(blob);
                        } else {
                            reject(new Error("Failed to compress image"));
                        }
                    },
                    'image/jpeg', // Convert to JPEG format for better compression
                    0.85 // Quality: 0.85 offers good balance between quality and file size
                );
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image'));
            };
            
            img.src = objectUrl;
        });
    }

    // Handle form submission
    async function handleSubmit() {
        if (!foodName.trim()) {
            // Focus on name input if empty
            nameInput.focus();
            return;
        }

        isUploading = true;
        uploadError = null;

        try {
            let imageUrl = foodItem.imageUrl || foodItem.image;
            
            // Upload new image if selected
            if (selectedPixabayImage && selectedPixabayImage.id !== foodItem.id) {
                // Use the smallest image URL available
                const smallImageUrl = selectedPixabayImage.smallImageUrl || selectedPixabayImage.previewURL;
                imageBlob = await fetchImageAsBlob(smallImageUrl);
                imageUrl = await uploadFoodImage(imageBlob, foodName);
            } else if (imageBlob) {
                imageUrl = await uploadFoodImage(imageBlob, foodName);
            }
            
            if (!imageUrl) {
                throw new Error("Failed to process image");
            }

            // Create the updated food item
            const updatedFood = {
                id: foodItem.id, // Keep the same ID
                name: foodName.trim(),
                category: selectedCategory || foodItem.category,
                image: imageUrl,
                // Preserve other properties
                ...Object.fromEntries(
                    Object.entries(foodItem).filter(([key]) => 
                        !['id', 'name', 'category', 'image', 'imageUrl'].includes(key)
                    )
                )
            };

            // Save the food item to Firebase
            await saveFoodItem(updatedFood);
            
            // Notify parent component
            if (onSave) onSave(updatedFood);
            
            // Close the modal and reset form
            closeModal();
            
        } catch (error) {
            console.error("Error saving food item:", error);
            uploadError = "Failed to save food item";
        } finally {
            isUploading = false;
        }
    }

    // Handle delete confirmation
    function handleDeleteConfirmation() {
        if (confirmDeleteMode) {
            handleDelete();
        } else {
            confirmDeleteMode = true;
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

    // Focus on the name input when the modal is opened
    $: if (showModal && nameInput) {
        setTimeout(() => nameInput.focus(), 100);
    }
</script>

{#if showModal && foodItem}
    <div class="modal" style="display: flex;">
        <div class="modal-content">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            
            <h2>Edit Food Item</h2>
            
            <div class="form-group">
                <label for="food-name">Food Name:</label>
                <input
                    id="food-name"
                    type="text"
                    bind:value={foodName}
                    bind:this={nameInput}
                    placeholder="Enter food name"
                />
                <button 
                    type="button" 
                    class="search-with-name-btn" 
                    on:click={updateImageSearch}
                    title="Search for images using this name"
                >
                    🔍
                </button>
            </div>
            
            <div class="form-group">
                <label for="food-category">Category:</label>
                <select id="food-category" bind:value={selectedCategory}>
                    {#each categories as category}
                        <option value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
                    {/each}
                </select>
            </div>
            
            <!-- Current image display -->
            {#if (foodItem.imageUrl || foodItem.image) && !imageData && !selectedPixabayImage}
                <div class="current-image">
                    <div class="preview-label">Current Image:</div>
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
                    Upload Custom Image
                </button>
            </div>
            
            {#if imageData}
                <div class="custom-image-preview">
                    <div class="preview-label">New Custom Image:</div>
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
                            Delete
                        </button>
                    {:else}
                        <button type="button" on:click={handleDelete} class="confirm-delete-btn">
                            Confirm Delete
                        </button>
                        <button type="button" on:click={() => confirmDeleteMode = false} class="cancel-delete-btn">
                            Cancel
                        </button>
                    {/if}
                </div>
                <div class="right-actions">
                    <button type="button" on:click={closeModal} class="cancel-btn">
                        Cancel
                    </button>
                    <button
                        type="button"
                        on:click={handleSubmit}
                        class="submit-btn"
                        disabled={isUploading || !foodName.trim() || confirmDeleteMode}
                    >
                        {isUploading ? 'Saving...' : 'Save Changes'}
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

    input[type="text"], select {
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
</style>
<script>
    import { onMount } from "svelte";
    import {
        uploadFoodImage,
        centerObject,
        enhanceImage,
    } from "../cloudinary.js";
    import { saveFoodItem } from "../firebase.js";
    import { fetchImageAsBlob } from "../pixabay.js";
    import { generateFoodId } from "../utils.js";
    import PixabayImageSearch from "./PixabayImageSearch.svelte";

    // Exported props
    export let showModal = false;
    export let onAddFood;
    export let currentCategory = "fruit";

    // Local state
    let foodName = "";
    let fileInput;
    let nameInput;
    let imageData = null;
    let imageBlob = null;
    let isUploading = false;
    let uploadError = null;
    let selectedPixabayImage = null;

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
        imageData = null;
        imageBlob = null;
        isUploading = false;
        uploadError = null;
        selectedPixabayImage = null;
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

    // Handle image file selection
    async function handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            imageBlob = file;
            
            // Create a preview
            const reader = new FileReader();
            reader.onload = (e) => {
                imageData = e.target.result;
            };
            reader.readAsDataURL(file);
            
            // Reset the selected Pixabay image if user uploads their own
            selectedPixabayImage = null;
        } catch (error) {
            console.error("Error processing image:", error);
            uploadError = "Failed to process the image";
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
            const imageUrl = await uploadFoodImage(imageBlob, foodName);
            
            if (!imageUrl) {
                throw new Error("Failed to upload image");
            }

            // Generate a food ID based on the name
            const foodId = generateFoodId(foodName.trim());
            console.log(`Generated food ID: ${foodId} for "${foodName}"`);
            
            // Create the food item
            const newFood = {
                id: foodId,
                name: foodName.trim(),
                category: currentCategory,
                image: imageUrl,
                // Add any additional food properties here
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
</script>

{#if showModal}
    <div class="modal" style="display: flex;">
        <div class="modal-content">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            
            <div class="form-group">
                <input
                    id="food-name"
                    type="text"
                    bind:this={nameInput}
                    bind:value={foodName}
                    placeholder="Enter food name"
                />
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

    input[type="text"] {
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
</style>

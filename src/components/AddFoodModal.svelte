<script>
    import { onMount, afterUpdate } from 'svelte';
    import { uploadFoodImage, centerObject, enhanceImage } from '../cloudinary.js';
    import { saveFoodItem } from '../firebase.js'; // For database operations
    
    // Exported props
    export let showModal = false;
    export let onAddFood;
    export let currentCategory = 'fruit'; // Default to fruit instead of custom
    
    // Local state
    let foodName = '';
    let foodEmoji = '🍽️'; // Default emoji
    let fileInput;
    let nameInput;
    let imageData = null; // Store the image data URL for preview
    let imageBlob = null; // Store the image blob for upload
    let isUploading = false;
    let uploadError = null;
    
    // Image resize configuration
    const IMAGE_CONFIG = {
        maxFileSizeKB: 50,
        initialQuality: 0.7,
        minQuality: 0.1,
        compressionStep: 0.1
    };
    
    // Reset modal form to initial state
    function resetForm() {
        foodName = '';
        foodEmoji = '🍽️';
        imageData = null;
        imageBlob = null;
        isUploading = false;
        uploadError = null;
    }
    
    // Close the modal and reset the form
    function closeModal() {
        showModal = false;
        resetForm();
    }
    
    // Handle adding a new food item
    async function handleAddFood() {
        const trimmedName = foodName.trim();
        if (!trimmedName) return;
        
        const foodId = `food_${Date.now()}`;
        
        // Create base food item object
        const newFood = {
            id: foodId,
            name: trimmedName,
            emoji: foodEmoji,
            category: currentCategory, // Use current category
            createdAt: new Date().toISOString()
        };
        
        try {
            isUploading = true;
            uploadError = null;
            
            // If there's an image, upload it to Cloudinary
            if (imageBlob) {
                try {
                    // Upload to Cloudinary with auto-centering enabled
                    const imageUrl = await uploadFoodImage(imageBlob, foodId, {
                        autoCenter: true // Enable AI-powered centering during upload
                    });
                    
                    // Apply additional enhancements to ensure the object is properly centered
                    const enhancedUrl = enhanceImage(
                        centerObject(imageUrl, {
                            width: 400,
                            height: 400,
                            zoom: 1.1 // Slight zoom to better focus on the food item
                        }),
                        { improve: true }
                    );
                    
                    newFood.imageUrl = enhancedUrl; // Store enhanced Cloudinary URL
                    console.log('Image uploaded to Cloudinary with auto-centering:', enhancedUrl);
                } catch (error) {
                    console.error('Failed to upload image to Cloudinary:', error);
                    uploadError = 'Failed to upload image to cloud storage.';
                    
                    // Instead of storing a base64 data URL in Firebase, we'll just use the emoji
                    // This prevents large binary data from being stored in Firebase
                    console.log('Using emoji instead of image due to upload failure');
                    // We're NOT setting newFood.imageData = imageData;
                }
            }
            
            // Save the food item data to Firebase Firestore
            try {
                const firestoreId = await saveFoodItem(newFood);
                console.log('Food item saved to Firestore with ID:', firestoreId);
                
                // Update the newFood object with the Firestore document ID
                newFood.firestoreId = firestoreId;
            } catch (error) {
                console.error('Failed to save food item to Firebase:', error);
                uploadError = uploadError || 'Failed to save food data to database.';
            }
            
            // Send to parent and close
            onAddFood(newFood);
            closeModal();
            
        } catch (error) {
            console.error('Error in handleAddFood:', error);
            uploadError = 'An unexpected error occurred.';
        } finally {
            isUploading = false;
        }
    }
    
    // Open camera or file picker
    function activateCamera() {
        fileInput = document.getElementById('food-image-input');
        if (!fileInput) {
            console.error("File input not found");
            return;
        }
        
        fileInput.setAttribute("capture", "environment");
        fileInput.setAttribute("accept", "image/*");
        fileInput.click();
    }
    
    // Handle image file selection
    function handleImageSelection(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Process the image
        resizeAndCompressImage(file);
        
        // Reset input for future selections
        if (fileInput) fileInput.value = '';
    }
    
    // Process image for optimization
    function resizeAndCompressImage(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = () => processLoadedImage(img);
        };
        
        reader.readAsDataURL(file);
    }
    
    // Process an already loaded image object
    function processLoadedImage(img) {
        // Create canvas and get dimensions
        const canvas = document.createElement('canvas');
        const targetSize = 120; // Square size for food buttons
        
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        
        // Calculate cropping to maintain aspect ratio
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        
        if (img.width > img.height) {
            // Landscape image: crop the sides
            sourceX = (img.width - img.height) / 2;
            sourceWidth = img.height;
        } else if (img.height > img.width) {
            // Portrait image: crop the top/bottom
            sourceY = (img.height - img.width) / 2;
            sourceHeight = img.width;
        }
        
        // Draw the cropped, square image
        ctx.drawImage(
            img, 
            sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
            0, 0, targetSize, targetSize // Destination rectangle
        );
        
        // Compress the image
        compressImage(canvas);
    }
    
    // Compress the image to target file size
    function compressImage(canvas) {
        let quality = IMAGE_CONFIG.initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let currentSize = estimateFileSizeKB(dataUrl);
        
        // Reduce quality until target size is reached
        while (currentSize > IMAGE_CONFIG.maxFileSizeKB && quality > IMAGE_CONFIG.minQuality) {
            quality -= IMAGE_CONFIG.compressionStep;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            currentSize = estimateFileSizeKB(dataUrl);
        }
        
        // Log results and update state
        console.log(
            `Resized to ${canvas.width}x${canvas.height}, ` +
            `${Math.round(currentSize)}KB with quality ${quality.toFixed(1)}`
        );
        
        // Store data URL for preview
        imageData = dataUrl;
        
        // Convert data URL to Blob for Cloudinary upload
        canvas.toBlob(
            (blob) => { imageBlob = blob; },
            'image/jpeg',
            quality
        );
        
        foodEmoji = '📸';
    }
    
    // Estimate file size in KB from data URL
    function estimateFileSizeKB(dataUrl) {
        return Math.round((dataUrl.length * 3) / 4) / 1024;
    }
    
    // Initialize and focus on input when modal is shown
    function initializeModal() {
        if (!showModal) return;
        
        fileInput = document.getElementById('food-image-input');
        focusNameInput();
    }
    
    function focusNameInput() {
        setTimeout(() => nameInput?.focus(), 50);
    }
    
    // Lifecycle hooks
    onMount(initializeModal);
    afterUpdate(initializeModal);
</script>

{#if showModal}
    <div class="modal" style="display: flex;">
        <div class="modal-content">
            <span class="close-modal" on:click={closeModal}>&times;</span>
            <h2>Add New Food Item</h2>
            
            <div class="food-emoji-preview">
                {#if imageData}
                    <img src={imageData} alt="Selected food" />
                {:else}
                    <span>{foodEmoji}</span>
                {/if}
            </div>
            
            <div class="form-group">
                <label for="food-name">Food Name:</label>
                <input 
                    type="text" 
                    id="food-name" 
                    placeholder="Enter food name..." 
                    bind:value={foodName}
                    bind:this={nameInput}
                />
            </div>
            
            <div class="form-group">
                <label for="food-category">Category:</label>
                <div class="category-display">
                    {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}
                </div>
            </div>
            
            <div class="form-group">
                <button type="button" class="image-btn" on:click={activateCamera}>
                    📷 Take Photo
                </button>
                <input 
                    type="file" 
                    id="food-image-input" 
                    style="display: none;" 
                    on:change={handleImageSelection}
                />
            </div>
            
            <button 
                class="add-food-btn" 
                on:click={handleAddFood} 
                disabled={!foodName.trim() || isUploading}
            >
                {#if isUploading}
                    Uploading...
                {:else}
                    Add Food
                {/if}
            </button>
            
            {#if uploadError}
                <p class="error-message">{uploadError}</p>
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
    
    .food-emoji-preview {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 20px 0 30px;
        background-color: #f9f9f9;
        height: 120px;
        width: 120px;
        border-radius: 60px;
        font-size: 80px;
        margin: 0 auto 30px;
        overflow: hidden; /* Prevent image overflow */
    }
    
    .food-emoji-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover; /* Maintain aspect ratio while covering container */
    }
    
    .form-group {
        margin-bottom: 25px;
    }
    
    label {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
        font-size: 18px;
    }
    
    input[type="text"] {
        width: 100%;
        padding: 15px;
        border: 2px solid #ddd;
        border-radius: 12px;
        font-size: 18px;
    }
    
    .image-btn {
        background-color: #f0f0f0;
        padding: 12px 25px;
        border: none;
        border-radius: 12px;
        font-size: 18px;
        cursor: pointer;
        transition: background-color 0.3s;
        display: block;
        width: 100%;
    }
    
    .image-btn:hover {
        background-color: #e0e0e0;
    }
    
    .add-food-btn {
        background-color: #5c6ac4;
        color: white;
        padding: 15px 30px;
        border: none;
        border-radius: 12px;
        font-size: 20px;
        cursor: pointer;
        transition: background-color 0.3s;
        display: block;
        width: 100%;
    }
    
    .add-food-btn:hover:not([disabled]) {
        background-color: #4c59b4;
    }
    
    .add-food-btn:disabled {
        background-color: #a9b0d8;
        cursor: not-allowed;
    }
    
    .error-message {
        color: #e74c3c;
        font-size: 14px;
        margin-top: 10px;
        text-align: center;
    }

    .category-display {
        padding: 12px 15px;
        background-color: #f0f0f0;
        border-radius: 12px;
        font-size: 16px;
        color: #555;
    }
</style>
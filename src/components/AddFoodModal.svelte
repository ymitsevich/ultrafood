<script>
    import { onMount, afterUpdate } from 'svelte';
    
    export let showModal = false;
    export let onAddFood;
    
    let foodName = '';
    let foodEmoji = '🍽️'; // Default emoji
    let imageCapture = false;
    let fileInput;
    let nameInput;
    let imageData = null; // Store the image data URL
    
    // Image resize configuration
    const maxFileSizeKB = 50;
    const targetWidth = 300;
    const imageQuality = 0.7;
    
    function closeModal() {
        showModal = false;
        resetForm();
    }
    
    function resetForm() {
        foodName = '';
        foodEmoji = '🍽️';
        imageCapture = false;
        imageData = null;
    }
    
    function handleAddFood() {
        if (foodName.trim()) {
            // Generate a unique ID
            const id = 'custom_' + Date.now();
            
            // Create new food item with image if available
            const newFood = {
                id,
                name: foodName,
                emoji: foodEmoji,
                category: 'custom',
                custom: true,
                imageData: imageData // Include the image data if available
            };
            
            // Call the parent's callback
            onAddFood(newFood);
            
            // Close modal and reset form
            closeModal();
        }
    }
    
    function activateCamera() {
        // Ensure fileInput is initialized
        fileInput = document.getElementById('food-image-input');
        
        if (fileInput) {
            // On mobile devices this will open the camera
            fileInput.setAttribute("capture", "environment");
            fileInput.setAttribute("accept", "image/*");
            fileInput.click();
        } else {
            console.error("File input not found");
        }
    }
    
    function handleImageSelection(event) {
        const file = event.target.files[0];
        if (file) {
            // Resize and compress the image
            resizeAndCompressImage(file);
            
            // Reset the file input for future selections
            if (fileInput) {
                fileInput.value = '';
            }
        }
    }
    
    // Function to resize and compress the image
    function resizeAndCompressImage(file) {
        // Create a FileReader to read the image file
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = () => {
                // Create canvas for resizing
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions while maintaining aspect ratio
                if (width > targetWidth) {
                    const scaleFactor = targetWidth / width;
                    width = targetWidth;
                    height = Math.round(height * scaleFactor);
                }
                
                // Set canvas dimensions and draw resized image
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Start with high quality and gradually lower it until we hit target size
                let quality = imageQuality;
                let dataUrl;
                let currentSize;
                
                // First attempt at compression
                dataUrl = canvas.toDataURL('image/jpeg', quality);
                currentSize = Math.round((dataUrl.length * 3) / 4) / 1024; // Convert base64 to KB
                
                // Keep reducing quality until we're under maxFileSizeKB
                if (currentSize > maxFileSizeKB) {
                    const compressionStep = 0.1;
                    while (currentSize > maxFileSizeKB && quality > 0.1) {
                        quality -= compressionStep;
                        dataUrl = canvas.toDataURL('image/jpeg', quality);
                        currentSize = Math.round((dataUrl.length * 3) / 4) / 1024;
                    }
                }
                
                console.log(`Resized image to ${width}x${height}, ${Math.round(currentSize)}KB with quality ${quality.toFixed(1)}`);
                
                // Store the compressed image data URL
                imageData = dataUrl;
                
                // Update the emoji as a visual indicator in the modal
                foodEmoji = '📸';
            };
        };
        
        // Read the image file as a data URL
        reader.readAsDataURL(file);
    }
    
    // Use both onMount and afterUpdate to ensure fileInput is initialized
    onMount(() => {
        if (showModal) {
            fileInput = document.getElementById('food-image-input');
            focusNameInput();
        }
    });
    
    afterUpdate(() => {
        if (showModal) {
            fileInput = document.getElementById('food-image-input');
            focusNameInput();
        }
    });
    
    function focusNameInput() {
        // Add a small delay to ensure the DOM is fully rendered
        setTimeout(() => {
            if (nameInput) {
                nameInput.focus();
            }
        }, 50);
    }
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
            
            <button class="add-food-btn" on:click={handleAddFood} disabled={!foodName.trim()}>
                Add Food
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
</style>
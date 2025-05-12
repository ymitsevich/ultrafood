<script>
    import { onMount, afterUpdate, getContext } from 'svelte';
    
    // Get services from context with generic names
    const services = getContext('services') || {};
    const { imageSearch } = services;
    
    // Props
    export let searchQuery = '';
    export let onImageSelect = () => {};
    export let selectedImage = null; // Added to receive the currently selected image from the parent
    
    // Component state
    let searchResults = [];
    let isSearching = false;
    let searchError = null;
    let searchTimer = null;
    let selectedImageId = selectedImage?.id || null;
    
    // Update selectedImageId when selectedImage changes (from parent)
    $: if (selectedImage) {
        selectedImageId = selectedImage.id;
    }
    
    // Perform search whenever searchQuery changes (with debounce)
    $: if (searchQuery && searchQuery.length >= 3) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            performSearch(searchQuery);
        }, 500); // Debounce 500ms
    } else if (searchQuery.length < 3 && !selectedImage) {
        clearTimeout(searchTimer);
        searchResults = [];
    }
    
    // Perform the actual search
    async function performSearch(query) {
        if (!query || query.length < 3) return;
        
        isSearching = true;
        searchError = null;
        
        try {
            console.log(`Searching for food images: "${query}"`);
            const results = await imageSearch.searchFoodImages(query);
            console.log(`Raw search results:`, results);
            
            if (results && Array.isArray(results)) {
                // Filter and transform results
                searchResults = results.map(img => ({
                    id: img.id,
                    smallImageUrl: img.thumbnailUrl || img.smallImageUrl,
                    width: img.width,
                    height: img.height,
                    tags: img.tags
                }));
                
                // Remove the selected image from search results to avoid duplicates
                if (selectedImage) {
                    searchResults = searchResults.filter(img => img.id !== selectedImage.id);
                }
                
                console.log(`Found ${searchResults.length} valid images for "${query}"`);
            } else {
                // Don't clear results if we have a selected image
                if (!selectedImage) {
                    searchResults = [];
                } else {
                    searchResults = [];
                }
                console.log(`No valid results found for "${query}"`);
            }
        } catch (error) {
            console.error(`Error searching for images:`, error);
            searchError = error.message || 'Failed to search for images';
            if (!selectedImage) {
                searchResults = [];
            }
        } finally {
            isSearching = false;
        }
    }
    
    // Handle image selection
    function selectImage(image) {
        selectedImageId = image.id;
        onImageSelect(image);
    }
    
    // Clear selected image
    function clearSelectedImage() {
        selectedImageId = null;
        onImageSelect(null);
    }

    // On mount, perform an initial search if query is provided
    onMount(() => {
        if (searchQuery && searchQuery.length >= 3) {
            performSearch(searchQuery);
        }
    });
</script>

<!-- Search results display -->
<div class="pixabay-search">
    {#if isSearching && !selectedImage}
        <div class="search-status">Searching for images...</div>
    {:else if searchError && !selectedImage}
        <div class="search-error">Error: {searchError}</div>
    {:else if (selectedImage || searchResults.length > 0)}
        <div class="image-grid">
            <!-- Always show selected image first if available -->
            {#if selectedImage}
                <div class="image-item selected pinned">
                    <img src={selectedImage.smallImageUrl} alt="Selected image" />
                    <div class="selected-overlay">
                        <span class="pin-indicator">📌</span>
                        <button class="clear-selection-button" on:click={clearSelectedImage}>×</button>
                    </div>
                </div>
            {/if}
            
            <!-- Show other search results -->
            {#each searchResults as image}
                <div 
                    class="image-item"
                    class:selected={image.id === selectedImageId}
                    on:click={() => selectImage(image)}
                >
                    <img src={image.smallImageUrl} alt={image.tags || 'Food image'} />
                </div>
            {/each}
        </div>
    {:else if searchQuery && searchQuery.length >= 3}
        <div class="no-results">No images found for "{searchQuery}"</div>
    {/if}
</div>

<style>
    .pixabay-search {
        margin-bottom: 16px;
    }
    
    .search-status, .search-error, .no-results {
        padding: 12px;
        text-align: center;
        border-radius: 4px;
    }
    
    .search-status {
        background-color: #f5f5f5;
    }
    
    .search-error {
        background-color: #fce4ec;
        color: #c2185b;
    }
    
    .no-results {
        background-color: #f5f5f5;
        font-style: italic;
    }
    
    .image-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        grid-gap: 8px;
        max-height: 200px;
        overflow-y: auto;
        padding: 8px 0;
    }
    
    .image-item {
        height: 80px;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s ease;
        position: relative;
    }
    
    .image-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .image-item:hover:not(.pinned) {
        border-color: #95a5a6;
        transform: scale(1.05);
    }
    
    .image-item.selected {
        border-color: #3498db;
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
    }
    
    .image-item.pinned {
        cursor: default;
        grid-column: 1;
        grid-row: 1;
        border-color: #3498db;
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
        transform: none; /* Don't scale up pinned item */
    }
    
    .selected-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(52, 152, 219, 0.15);
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
    }
    
    .clear-selection-button {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.8);
        border: none;
        font-size: 16px;
        font-weight: bold;
        color: #666;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 4px;
    }
    
    .clear-selection-button:hover {
        background: rgba(255, 255, 255, 1);
        color: #e74c3c;
    }
    
    .pin-indicator {
        position: absolute;
        bottom: 4px;
        left: 4px;
        font-size: 14px;
    }
</style>
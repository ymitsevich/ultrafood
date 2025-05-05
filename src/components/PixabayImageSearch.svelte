<script>
    import { onMount, afterUpdate } from 'svelte';
    import { searchFoodImages } from '../pixabay.js';
    
    // Props
    export let searchQuery = '';
    export let onImageSelect = () => {};
    
    // Component state
    let searchResults = [];
    let isSearching = false;
    let searchError = null;
    let searchTimer = null;
    let selectedImageIndex = -1;
    
    // Perform search whenever searchQuery changes (with debounce)
    $: if (searchQuery && searchQuery.length >= 3) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            performSearch(searchQuery);
        }, 500); // Debounce 500ms
    } else {
        clearTimeout(searchTimer);
        searchResults = [];
    }
    
    // Perform the actual search
    async function performSearch(query) {
        if (!query || query.length < 3) return;
        
        isSearching = true;
        searchError = null;
        
        try {
            console.log(`Searching Pixabay for: "${query}"`);
            const results = await searchFoodImages(query);
            console.log(`Raw Pixabay results:`, results);
            
            if (results && Array.isArray(results)) {
                // Filter and transform results
                searchResults = results.map(img => ({
                    id: img.id,
                    smallImageUrl: img.thumbnailUrl || img.smallImageUrl,
                    width: img.width,
                    height: img.height,
                    tags: img.tags
                }));
                
                console.log(`Found ${searchResults.length} valid images for "${query}"`);
                if (searchResults.length > 0) {
                    console.log(`First image URL: ${searchResults[0].smallImageUrl}`);
                }
            } else {
                searchResults = [];
                console.log(`No valid results found for "${query}"`);
            }
        } catch (error) {
            console.error(`Error searching Pixabay:`, error);
            searchError = error.message || 'Failed to search for images';
            searchResults = [];
        } finally {
            isSearching = false;
            console.log(`isSearching: ${isSearching}`);
            console.log(`searchResults length: ${searchResults.length}`);
            console.log(`searchQuery length: ${searchQuery.length}`);
        }
    }
    
    // Handle image selection
    function selectImage(image, index) {
        selectedImageIndex = index;
        onImageSelect(image);
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
    {#if isSearching}
        <div class="search-status">Searching for images...</div>
    {:else if searchError}
        <div class="search-error">Error: {searchError}</div>
    {:else if searchResults.length > 0}
        <div class="image-grid">
            {#each searchResults as image, i}
                <div 
                    class="image-item" 
                    class:selected={selectedImageIndex === i}
                    on:click={() => selectImage(image, i)}
                >
                    <img src={image.smallImageUrl} alt={image.tags || 'Food image'} />
                    {#if selectedImageIndex === i}
                        <div class="selected-overlay">
                            <div class="checkmark">✓</div>
                        </div>
                    {/if}
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
    
    .image-item.selected {
        border-color: #3498db;
        box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
        transform: scale(1.05);
        z-index: 2;
    }
    
    .image-item:hover {
        border-color: #95a5a6;
    }
    
    .selected-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(52, 152, 219, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .checkmark {
        background: #3498db;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
    }
</style>
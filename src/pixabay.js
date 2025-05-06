// Pixabay API service for food image search
// Documentation: https://pixabay.com/api/docs/

// Get Pixabay API key from environment variables
const PIXABAY_API_KEY = import.meta.env.VITE_PIXABAY_API_KEY || '';

// Verify API key exists
if (!PIXABAY_API_KEY) {
    console.warn('Pixabay API key not found in environment variables. Image search will not work.');
}

/**
 * Search for food images on Pixabay
 * @param {string} query - The search query
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - Promise that resolves with image results
 */
export async function searchFoodImages(query, options = {}) {
    const defaultOptions = {
        perPage: 12,
        safesearch: true,
        imageType: 'photo',
        category: 'food'
    };

    const opts = { ...defaultOptions, ...options };

    try {
        const url = new URL('https://pixabay.com/api/');
        
        // Don't manually encode the query - let URLSearchParams handle it
        console.log(`Searching for "${query}"`);
        
        // Pass the raw query and let URLSearchParams handle the encoding
        const params = {
            key: PIXABAY_API_KEY,
            q: query,  // Raw query - URLSearchParams will encode it correctly
            image_type: opts.imageType,
            per_page: opts.perPage,
            safesearch: opts.safesearch ? 'true' : 'false',
            category: opts.category
        };

        // Add parameters to URL - URLSearchParams will handle encoding
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });
        
        console.log(`API URL: ${url.toString().replace(PIXABAY_API_KEY, 'API_KEY_HIDDEN')}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Pixabay API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Map the response to a simpler format
        return data.hits.map(hit => ({
            id: hit.id,
            thumbnailUrl: hit.previewURL,
            smallImageUrl: hit.webformatURL,
            largeImageUrl: hit.largeImageURL,
            width: hit.imageWidth,
            height: hit.imageHeight,
            tags: hit.tags,
            user: hit.user,
            pageUrl: hit.pageURL
        }));
    } catch (error) {
        console.error('Pixabay search error:', error);
        throw error;
    }
}

/**
 * Fetch an image from a URL and return as a blob
 * @param {string} imageUrl - The URL of the image
 * @returns {Promise<Blob>} - Promise that resolves with the image blob
 */
export async function fetchImageAsBlob(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }
        return await response.blob();
    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
}

export default {
    searchFoodImages,
    fetchImageAsBlob
};
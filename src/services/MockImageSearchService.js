import { ImageSearchService } from './interfaces/ImageSearchService.js';

/**
 * MockImageSearchService - a mock implementation of the ImageSearchService interface
 * that provides fake data for testing and development
 */
export class MockImageSearchService extends ImageSearchService {
  constructor() {
    super();
    // Create a set of mock food images for development and testing
    this.mockImages = [
      {
        id: 1001,
        thumbnailUrl: 'https://via.placeholder.com/150?text=Apple',
        smallImageUrl: 'https://via.placeholder.com/300?text=Apple',
        largeImageUrl: 'https://via.placeholder.com/800?text=Apple',
        width: 300,
        height: 300,
        tags: 'apple fruit healthy',
        user: 'mockuser'
      },
      {
        id: 1002,
        thumbnailUrl: 'https://via.placeholder.com/150?text=Banana',
        smallImageUrl: 'https://via.placeholder.com/300?text=Banana',
        largeImageUrl: 'https://via.placeholder.com/800?text=Banana',
        width: 300,
        height: 300,
        tags: 'banana fruit tropical',
        user: 'mockuser'
      },
      {
        id: 1003,
        thumbnailUrl: 'https://via.placeholder.com/150?text=Orange',
        smallImageUrl: 'https://via.placeholder.com/300?text=Orange',
        largeImageUrl: 'https://via.placeholder.com/800?text=Orange',
        width: 300,
        height: 300,
        tags: 'orange fruit citrus',
        user: 'mockuser'
      },
      {
        id: 1004,
        thumbnailUrl: 'https://via.placeholder.com/150?text=Strawberry',
        smallImageUrl: 'https://via.placeholder.com/300?text=Strawberry',
        largeImageUrl: 'https://via.placeholder.com/800?text=Strawberry',
        width: 300,
        height: 300,
        tags: 'strawberry fruit berry',
        user: 'mockuser'
      },
      {
        id: 1005,
        thumbnailUrl: 'https://via.placeholder.com/150?text=Pizza',
        smallImageUrl: 'https://via.placeholder.com/300?text=Pizza',
        largeImageUrl: 'https://via.placeholder.com/800?text=Pizza',
        width: 300,
        height: 300,
        tags: 'pizza fast food italian',
        user: 'mockuser'
      },
      {
        id: 1006,
        thumbnailUrl: 'https://via.placeholder.com/150?text=Salad',
        smallImageUrl: 'https://via.placeholder.com/300?text=Salad',
        largeImageUrl: 'https://via.placeholder.com/800?text=Salad',
        width: 300,
        height: 300,
        tags: 'salad healthy vegetable',
        user: 'mockuser'
      },
      {
        id: 1007,
        thumbnailUrl: 'https://via.placeholder.com/150?text=Burger',
        smallImageUrl: 'https://via.placeholder.com/300?text=Burger',
        largeImageUrl: 'https://via.placeholder.com/800?text=Burger',
        width: 300,
        height: 300,
        tags: 'burger fast food beef',
        user: 'mockuser'
      },
      {
        id: 1008,
        thumbnailUrl: 'https://via.placeholder.com/150?text=Pasta',
        smallImageUrl: 'https://via.placeholder.com/300?text=Pasta',
        largeImageUrl: 'https://via.placeholder.com/800?text=Pasta',
        width: 300,
        height: 300,
        tags: 'pasta italian carbs',
        user: 'mockuser'
      }
    ];
  }

  /**
   * @inheritdoc
   */
  async searchImages(query, options = {}) {
    console.log(`[MOCK] Searching for images with query: "${query}"`);
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Case insensitive search in tags and image name (from URL)
    const lowerQuery = query.toLowerCase();
    
    // Filter images based on the query
    const results = this.mockImages.filter(image => {
      const tags = image.tags.toLowerCase();
      const url = image.smallImageUrl.toLowerCase();
      
      return tags.includes(lowerQuery) || url.includes(lowerQuery);
    });
    
    // Limit results based on options
    const limit = options.perPage || 12;
    const limitedResults = results.slice(0, limit);
    
    console.log(`[MOCK] Found ${limitedResults.length} results for "${query}"`);
    return limitedResults;
  }

  /**
   * @inheritdoc
   */
  async fetchImageAsBlob(imageUrl) {
    console.log(`[MOCK] Fetching image blob from URL: ${imageUrl}`);
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      // Actually fetch the placeholder image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch mock image: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('[MOCK] Error fetching image:', error);
      
      // Fallback: Create a 1x1 transparent PNG blob
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
      ctx.fillRect(0, 0, 1, 1);
      
      return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png');
      });
    }
  }
}
import { ImageSearchService } from './interfaces/ImageSearchService.js';
import * as pixabayModule from '../pixabay.js';

/**
 * Pixabay implementation of the ImageSearchService interface
 */
export class PixabayImageSearchService extends ImageSearchService {
  constructor() {
    super();
    this.API_KEY = import.meta.env.VITE_PIXABAY_API_KEY || '';
    
    if (!this.API_KEY) {
      console.warn('Pixabay API key not found in environment variables. Image search will not work.');
    }
  }

  /**
   * @inheritdoc
   */
  async searchImages(query, options = {}) {
    // Adapting the interface method to the original pixabay.js implementation
    return pixabayModule.searchFoodImages(query, options);
  }

  /**
   * @inheritdoc
   */
  async fetchImageAsBlob(imageUrl) {
    return pixabayModule.fetchImageAsBlob(imageUrl);
  }
}
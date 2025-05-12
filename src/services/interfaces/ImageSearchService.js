/**
 * @interface ImageSearchService
 * Defines the contract that any image search service implementation must fulfill.
 */
export class ImageSearchService {
  /**
   * Search for images based on a query string
   * @param {string} query - The search query
   * @param {Object} options - Additional options for the search
   * @returns {Promise<Array>} - Promise that resolves with image results
   */
  async searchImages(query, options = {}) {
    throw new Error('Method searchImages() must be implemented');
  }

  /**
   * Fetch an image from a URL and return as a blob
   * @param {string} imageUrl - The URL of the image
   * @returns {Promise<Blob>} - Promise that resolves with the image blob
   */
  async fetchImageAsBlob(imageUrl) {
    throw new Error('Method fetchImageAsBlob() must be implemented');
  }
}
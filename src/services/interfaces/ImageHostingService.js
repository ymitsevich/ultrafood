/**
 * @interface ImageHostingService
 * Defines the contract that any image hosting service implementation must fulfill.
 */
export class ImageHostingService {
  /**
   * Upload an image to the hosting service
   * @param {Blob} imageBlob - The image blob to upload
   * @param {string} itemId - The ID of the item (used for reference)
   * @param {Object} options - Additional options for upload
   * @returns {Promise<string>} - Promise that resolves with the image URL
   */
  async uploadImage(imageBlob, itemId, options = {}) {
    throw new Error('Method uploadImage() must be implemented');
  }

  /**
   * Delete an image from the hosting service
   * @param {string} imageUrl - The URL of the image to delete
   * @returns {Promise<boolean>} - Promise that resolves when deletion is complete
   */
  async deleteImage(imageUrl) {
    throw new Error('Method deleteImage() must be implemented');
  }

  /**
   * Generate an optimized image URL with transformation parameters
   * @param {string} url - The original image URL
   * @param {Object} options - Transformation options
   * @returns {string} - Optimized image URL
   */
  optimizeUrl(url, options = {}) {
    throw new Error('Method optimizeUrl() must be implemented');
  }

  /**
   * Apply automatic object centering to an image URL
   * @param {string} url - The original image URL
   * @param {Object} options - Additional options
   * @returns {string} - URL with auto-centering transformation
   */
  centerObject(url, options = {}) {
    throw new Error('Method centerObject() must be implemented');
  }

  /**
   * Enhance an image with improvements
   * @param {string} url - The original image URL
   * @param {Object} options - Enhancement options
   * @returns {string} - URL with enhancements
   */
  enhanceImage(url, options = {}) {
    throw new Error('Method enhanceImage() must be implemented');
  }
}
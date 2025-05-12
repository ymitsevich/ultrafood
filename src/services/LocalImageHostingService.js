import { ImageHostingService } from './interfaces/ImageHostingService.js';

/**
 * LocalImageHostingService - a mock implementation of the ImageHostingService interface
 * that stores images locally in memory/localStorage for development and testing
 */
export class LocalImageHostingService extends ImageHostingService {
  constructor() {
    super();
    this.imageStore = new Map();
  }

  /**
   * @inheritdoc
   */
  async uploadImage(imageBlob, itemId, options = {}) {
    // Create a local URL from the blob
    const localUrl = URL.createObjectURL(imageBlob);
    
    // Store the association between item ID and URL
    this.imageStore.set(itemId, localUrl);
    
    console.log(`Local image stored for ${itemId}: ${localUrl}`);
    
    // Persist to localStorage to survive page refreshes
    try {
      // First get existing stored images
      const storedImages = JSON.parse(localStorage.getItem('localImageStore') || '{}');
      
      // Convert Blob to base64 for storage
      const reader = new FileReader();
      
      // Wrap in a promise for async/await support
      const base64Data = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });
      
      // Update with new image and save back
      storedImages[itemId] = base64Data;
      localStorage.setItem('localImageStore', JSON.stringify(storedImages));
    } catch (error) {
      console.warn('Failed to persist image to localStorage:', error);
    }
    
    return localUrl;
  }

  /**
   * @inheritdoc
   */
  async deleteImage(imageUrl) {
    // Find item ID for this URL
    let deletedId = null;
    
    this.imageStore.forEach((url, id) => {
      if (url === imageUrl) {
        deletedId = id;
      }
    });
    
    if (deletedId) {
      // Remove from our map
      this.imageStore.delete(deletedId);
      
      // Remove from localStorage too
      try {
        const storedImages = JSON.parse(localStorage.getItem('localImageStore') || '{}');
        delete storedImages[deletedId];
        localStorage.setItem('localImageStore', JSON.stringify(storedImages));
      } catch (error) {
        console.warn('Failed to remove image from localStorage:', error);
      }
      
      console.log(`Deleted local image for ${deletedId}`);
      return true;
    }
    
    return false;
  }

  /**
   * @inheritdoc
   */
  optimizeUrl(url, options = {}) {
    // Local implementation doesn't optimize URLs, just returns as-is
    // You could implement simple resizing if needed using canvas
    return url;
  }

  /**
   * @inheritdoc
   */
  centerObject(url, options = {}) {
    // Local implementation doesn't support centering
    return url;
  }

  /**
   * @inheritdoc
   */
  enhanceImage(url, options = {}) {
    // Local implementation doesn't support enhancements
    return url;
  }

  /**
   * Helper method to check if we have a stored image for an item
   * @param {string} itemId - The ID of the item
   * @returns {string|null} - The stored image URL or null
   */
  getStoredImageForItem(itemId) {
    return this.imageStore.get(itemId) || null;
  }

  /**
   * Load any images saved in localStorage
   * @returns {number} - Number of images loaded
   */
  loadPersistedImages() {
    try {
      const storedImages = JSON.parse(localStorage.getItem('localImageStore') || '{}');
      
      // Convert base64 back to object URLs and add to our map
      Object.entries(storedImages).forEach(([id, base64Data]) => {
        // Convert base64 to blob
        const byteString = atob(base64Data.split(',')[1]);
        const mimeType = base64Data.match(/data:([^;]+)/)[1];
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([arrayBuffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Store in our map
        this.imageStore.set(id, url);
      });
      
      console.log(`Loaded ${this.imageStore.size} persisted images`);
      return this.imageStore.size;
    } catch (error) {
      console.error('Failed to load persisted images:', error);
      return 0;
    }
  }
}
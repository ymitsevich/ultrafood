import { ImageHostingService } from './interfaces/ImageHostingService.js';
import * as cloudinaryModule from '../cloudinary.js';

/**
 * Cloudinary implementation of the ImageHostingService interface
 */
export class CloudinaryImageHostingService extends ImageHostingService {
  constructor() {
    super();
    this.CLOUDINARY_CLOUD_NAME = 'do4lznbge';
    this.CLOUDINARY_UPLOAD_PRESET = 'food_images';
  }

  /**
   * @inheritdoc
   */
  async uploadImage(imageBlob, itemId, options = {}) {
    // Rename uploadFoodImage to uploadImage in cloudinary.js later
    return await cloudinaryModule.uploadFoodImage(imageBlob, itemId, options);
  }

  /**
   * @inheritdoc
   */
  async deleteImage(imageUrl) {
    // Rename deleteFoodImage to deleteImage in cloudinary.js later
    return await cloudinaryModule.deleteFoodImage(imageUrl);
  }

  /**
   * @inheritdoc
   */
  optimizeUrl(url, options = {}) {
    // Rename optimizeCloudinaryUrl to optimizeUrl in cloudinary.js later
    return cloudinaryModule.optimizeCloudinaryUrl(url, options);
  }

  /**
   * @inheritdoc
   */
  centerObject(url, options = {}) {
    return cloudinaryModule.centerObject(url, options);
  }

  /**
   * @inheritdoc
   */
  enhanceImage(url, options = {}) {
    return cloudinaryModule.enhanceImage(url, options);
  }
}
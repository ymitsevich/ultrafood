import { ImageHostingService } from './interfaces/ImageHostingService.js';

/**
 * Cloudinary implementation of the ImageHostingService interface
 */
export class CloudinaryImageHostingService extends ImageHostingService {
  constructor() {
    super();
    // Cloudinary credentials
    this.CLOUDINARY_CLOUD_NAME = 'do4lznbge';
    // We need an unsigned upload preset for client-side uploads (create this in Cloudinary dashboard)
    this.CLOUDINARY_UPLOAD_PRESET = 'food_images';
    
    // Bind methods to ensure 'this' context is preserved
    this.uploadImage = this.uploadImage.bind(this);
    this.deleteImage = this.deleteImage.bind(this);
    this.optimizeUrl = this.optimizeUrl.bind(this);
    this.centerObject = this.centerObject.bind(this);
    this.enhanceImage = this.enhanceImage.bind(this);
  }

  /**
   * Sanitize a string to be used as a filename or ID
   * Removes or replaces special characters that could cause problems in URLs or APIs
   * @param {string} name - The filename to sanitize
   * @returns {string} - The sanitized filename
   * @private
   */
  sanitizeFilename(name) {
    if (!name) return "";
    // Replace special characters with underscores
    return name.trim()
        .replace(/[&+/\\#,+()$~%'":*?<>{}]/g, '_')
        .replace(/\s+/g, '_');
  }

  /**
   * @inheritdoc
   */
  async uploadImage(imageBlob, itemId, options = {}) {
    const formData = new FormData();
    formData.append('file', imageBlob);
    formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'food-images');
    
    // Sanitize the itemId to avoid issues with special characters
    const sanitizedId = this.sanitizeFilename(itemId);
    
    // For edit operations, append timestamp to ensure unique public_id
    // This forces Cloudinary to create a new image instead of returning existing one
    const timestamp = Date.now();
    const uniquePublicId = `${sanitizedId}-${timestamp}`;
    formData.append('public_id', uniquePublicId);
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Image uploaded to Cloudinary:', data);
      
      // Return the secure URL of the uploaded image
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * @inheritdoc
   */
  async deleteImage(imageUrl) {
    // Extract public_id from URL
    // NOTE: Cloudinary deletion requires API authentication with API Key and Secret
    // You typically handle deletions on the server side with proper authentication
    console.warn('Cloudinary deletion requires backend API integration with authentication');
    return false;
  }

  /**
   * @inheritdoc
   */
  optimizeUrl(url, options = {}) {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }
    
    const defaults = {
      width: 120,
      height: 120,
      crop: 'fill',
      gravity: 'auto:subject', // Changed from 'auto' to 'auto:subject' for better centering
      quality: 'auto',
      format: 'auto'
    };
    
    const params = { ...defaults, ...options };
    
    // Find the upload/ part in the URL and insert our transformations
    return url.replace(
      '/upload/',
      `/upload/c_${params.crop},w_${params.width},h_${params.height},g_${params.gravity},q_${params.quality},f_${params.format}/`
    );
  }

  /**
   * @inheritdoc
   */
  centerObject(url, options = {}) {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }
    
    const defaults = {
      width: 400,
      height: 400,
      crop: 'fill',
      removeBackground: false,
      zoom: 1.0
    };
    
    const params = { ...defaults, ...options };
    
    let transformation = `c_${params.crop},w_${params.width},h_${params.height},g_auto:subject`;
    
    // Add zoom if specified (useful for getting closer to the main subject)
    if (params.zoom && params.zoom !== 1.0) {
      transformation += `,z_${params.zoom}`;
    }
    
    // Add background removal if requested
    if (params.removeBackground) {
      transformation += '/e_background_removal';
    }
    
    // Find the upload/ part in the URL and insert our transformations
    return url.replace('/upload/', `/upload/${transformation}/`);
  }

  /**
   * @inheritdoc
   */
  enhanceImage(url, options = {}) {
    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }
    
    const defaults = {
      improve: true,      // Basic improvement
      color: false,       // Color enhancement  
      redeye: false,      // Red-eye removal
      brightening: 0,     // Brightening level 0-100
      blurFaces: false    // Blur faces in the image
    };
    
    const params = { ...defaults, ...options };
    
    let transformations = [];
    
    if (params.improve) {
      transformations.push('e_improve');
    }
    
    if (params.color) {
      transformations.push('e_improve:color');
    }
    
    if (params.redeye) {
      transformations.push('e_redeye');
    }
    
    if (params.brightening > 0) {
      transformations.push(`e_brightness:${params.brightening}`);
    }
    
    if (params.blurFaces) {
      transformations.push('e_pixelate_faces:15');
    }
    
    if (transformations.length === 0) {
      return url;
    }
    
    // Combine all transformations
    const transformString = transformations.join('/');
    
    // Find the upload/ part in the URL and insert our transformations
    return url.replace('/upload/', `/upload/${transformString}/`);
  }
}
// Cloudinary direct upload integration
// Using Cloudinary's unsigned upload preset functionality for client-side uploads

// Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = 'do4lznbge';
// We need an unsigned upload preset for client-side uploads (create this in Cloudinary dashboard)
const CLOUDINARY_UPLOAD_PRESET = 'food_images'; // You need to create this preset in Cloudinary dashboard

/**
 * Upload an image to Cloudinary
 * @param {Blob} imageBlob - The image blob to upload
 * @param {string} foodId - The ID of the food item (used for reference)
 * @param {Object} options - Additional options for upload
 * @returns {Promise<string>} - Promise that resolves with the Cloudinary URL
 */
export async function uploadFoodImage(imageBlob, foodId, options = {}) {
  const formData = new FormData();
  formData.append('file', imageBlob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'food-images');
  formData.append('public_id', foodId);
  
  // Remove the eager parameters that were causing issues with unsigned uploads
  // We'll apply transformations after upload instead
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
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
 * Delete an image from Cloudinary
 * @param {string} imageUrl - The Cloudinary URL of the image to delete
 * @returns {Promise<boolean>} - Promise that resolves when deletion is complete
 */
export async function deleteFoodImage(imageUrl) {
  // Extract public_id from URL
  // NOTE: Cloudinary deletion requires API authentication with API Key and Secret
  // You typically handle deletions on the server side with proper authentication
  console.warn('Cloudinary deletion requires backend API integration with authentication');
  return false;
}

/**
 * Generate a Cloudinary URL with optimization parameters
 * @param {string} url - The original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string} - Optimized Cloudinary URL
 */
export function optimizeCloudinaryUrl(url, options = {}) {
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
 * Apply automatic object centering to a Cloudinary image URL
 * @param {string} url - The original Cloudinary URL
 * @param {Object} options - Additional options
 * @returns {string} - URL with auto-centering transformation
 */
export function centerObject(url, options = {}) {
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
 * Enhance an image with AI-powered improvements
 * @param {string} url - The original Cloudinary URL
 * @param {Object} options - Enhancement options
 * @returns {string} - URL with AI enhancements
 */
export function enhanceImage(url, options = {}) {
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
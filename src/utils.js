/**
 * Utility functions for the FTK app
 */

/**
 * Transliterate Cyrillic text to Latin characters
 * @param {string} text - The text to transliterate
 * @returns {string} - The transliterated text
 */
export function transliterate(text) {
  // Create mapping of Cyrillic to Latin characters
  const cyrillicToLatin = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    // Ukrainian/Belarusian letters
    'є': 'ye', 'і': 'i', 'ї': 'yi', 'ґ': 'g',
    // Capital letters
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'YO',
    'Ж': 'ZH', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'TS', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH', 'Ъ': '',
    'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'YU', 'Я': 'YA',
    'Є': 'YE', 'І': 'I', 'Ї': 'YI', 'Ґ': 'G'
  };

  return text.split('').map(char => cyrillicToLatin[char] || char).join('');
}

/**
 * Generate a slug from text
 * @param {string} text - The text to slugify
 * @returns {string} - A slug suitable for use as an ID
 */
export function generateSlug(text) {
  if (!text) return '';

  // Transliterate any Cyrillic characters
  const transliterated = transliterate(text);
  
  // Convert to lowercase, replace spaces and special characters with hyphens
  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-');     // Remove consecutive hyphens
}

/**
 * Generate a unique ID for food items based on the name
 * @param {string} foodName - The name of the food
 * @returns {string} - A unique ID
 */
export function generateFoodId(foodName) {
  const slug = generateSlug(foodName);
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp for uniqueness
  
  return slug ? `${slug}-${timestamp}` : `food-${timestamp}`;
}

/**
 * Format a date into a human-readable ID suitable for database keys
 * @param {Date|string|null} date - The date to format (defaults to current date/time)
 * @returns {string} - A formatted date string like "2025-05-06-1432-59" (YYYY-MM-DD-HHMM-SS)
 */
export function formatDateForId(date = null) {
  const d = date ? new Date(date) : new Date();
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  // Format: YYYY-MM-DD-HHMM-SS
  return `${year}-${month}-${day}-${hours}${minutes}-${seconds}`;
}

/**
 * Generate a human-readable ID for a meal
 * @param {string|null} prefix - Optional prefix for the ID
 * @param {Date|string|null} timestamp - The meal timestamp (defaults to current date/time)
 * @returns {string} - A human-readable meal ID
 */
export function generateMealId(prefix = 'meal', timestamp = null) {
  const dateStr = formatDateForId(timestamp);
  
  // Add a random suffix (3 characters) to prevent duplicate IDs for meals submitted at the same time
  const randomSuffix = Math.random().toString(36).substring(2, 5);
  
  return `${prefix}-${dateStr}-${randomSuffix}`;
}
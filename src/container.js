import { createContainer, asValue } from 'awilix';
import { FirebaseDatabaseService } from './services/FirebaseDatabaseService.js';
import { CloudinaryImageHostingService } from './services/CloudinaryImageHostingService.js';
import { PixabayImageSearchService } from './services/PixabayImageSearchService.js';

// Create the container
const container = createContainer();

// Determine if we're in test mode
const isTest = process.env.NODE_ENV === 'test';

// Create service instances
const databaseService = new FirebaseDatabaseService();
const imageHostingService = new CloudinaryImageHostingService();
const imageSearchService = new PixabayImageSearchService();

// Register all services
container.register({
  // Core services with generic names
  database: asValue(databaseService),
  imageHosting: asValue(imageHostingService),
  imageSearch: asValue(imageSearchService),
  
  // Environment variables and configuration
  isTestEnv: asValue(isTest)
});

export default container;
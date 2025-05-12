import { createContainer, asValue } from 'awilix';
import * as cloudinaryModule from './cloudinary.js';
import * as pixabayModule from './pixabay.js';
import { FirebaseDatabaseService } from './services/FirebaseDatabaseService.js';

// Create the container
const container = createContainer();

// Determine if we're in test mode
const isTest = process.env.NODE_ENV === 'test';

// Create service instances
const databaseService = new FirebaseDatabaseService();
const imageHosting = { ...cloudinaryModule };
const imageSearch = { ...pixabayModule };

// Register all services
container.register({
  // Core services with generic names
  database: asValue(databaseService),
  imageHosting: asValue(imageHosting),
  imageSearch: asValue(imageSearch),
  
  // Environment variables and configuration
  isTestEnv: asValue(isTest)
});

export default container;
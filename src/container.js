import { createContainer, asValue } from 'awilix';
import { FirebaseDatabaseService } from './services/FirebaseDatabaseService.js';
import { CloudinaryImageHostingService } from './services/CloudinaryImageHostingService.js';
import { PixabayImageSearchService } from './services/PixabayImageSearchService.js';
import { InMemoryDatabaseService } from './services/InMemoryDatabaseService.js';
import { LocalImageHostingService } from './services/LocalImageHostingService.js';
import { MockImageSearchService } from './services/MockImageSearchService.js';

// Create the container
const container = createContainer();

// Determine if we're in test mode
const isTest = process.env.NODE_ENV === 'test';

// Create service instances based on environment
let databaseService, imageHostingService, imageSearchService;

if (isTest) {
  console.log('[Container] Running in TEST environment, using mock/local services');
  databaseService = new InMemoryDatabaseService();
  imageHostingService = new LocalImageHostingService();
  imageSearchService = new MockImageSearchService();
} else {
  console.log(`[Container] Running in ${process.env.NODE_ENV || 'development'} environment, using production services`);
  databaseService = new FirebaseDatabaseService();
  imageHostingService = new CloudinaryImageHostingService();
  imageSearchService = new PixabayImageSearchService();
}

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
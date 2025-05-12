import { createContainer, asValue } from 'awilix';
import * as firebaseModule from './firebase.js';
import * as cloudinaryModule from './cloudinary.js';
import * as pixabayModule from './pixabay.js';

// Create the container
const container = createContainer();

// Determine if we're in test mode
const isTest = process.env.NODE_ENV === 'test';

// Create proper service wrappers around the imported modules
const database = {
  ...firebaseModule
};

const imageHosting = {
  ...cloudinaryModule
};

const imageSearch = {
  ...pixabayModule
};

// Register all services
container.register({
  // Core services with generic names
  database: asValue(database),
  imageHosting: asValue(imageHosting),
  imageSearch: asValue(imageSearch),
  
  // Keep implementation-specific registrations for backward compatibility
  // These can be gradually phased out as components are updated
  firebase: asValue(database),
  cloudinary: asValue(imageHosting),
  pixabay: asValue(imageSearch),
  
  // Environment variables and configuration
  isTestEnv: asValue(isTest)
});

export default container;
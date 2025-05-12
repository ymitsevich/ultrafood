import { createContainer, asValue } from 'awilix';
import * as firebase from './firebase.js';
import * as cloudinary from './cloudinary.js';
import * as pixabay from './pixabay.js';

// Create the container
const container = createContainer();

// Determine if we're in test mode
const isTest = process.env.NODE_ENV === 'test';

// Register all services
container.register({
  // Core services
  firebase: asValue(firebase),
  cloudinary: asValue(cloudinary),
  pixabay: asValue(pixabay),
  
  // Environment variables and configuration
  isTestEnv: asValue(isTest)
});

export default container;
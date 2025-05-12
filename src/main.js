import App from './MealLoggerApp.svelte';
import container from './container.js';

// Get the services from the container using generic names
const services = {
    // Generic service names that components expect
    database: container.resolve('database'),
    imageHosting: container.resolve('imageHosting'),
    imageSearch: container.resolve('imageSearch'),
    
    // Also include old names for backward compatibility
    firebase: container.resolve('firebase'),
    cloudinary: container.resolve('cloudinary'),
    pixabay: container.resolve('pixabay')
};

const app = new App({
    target: document.getElementById('app'),
    props: {
        services
    }
});

export default app;

import App from './MealLoggerApp.svelte';
import container from './container.js';

// Debug environment information
console.log('----------------------------------------');
console.log('Environment Debug Information:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

// Get the services from the container using generic names
const services = {
    database: container.resolve('database'),
    imageHosting: container.resolve('imageHosting'),
    imageSearch: container.resolve('imageSearch'),
    auth: container.resolve('auth')
};

// Make container available for testing
if (process.env.NODE_ENV === 'test') {
    window.__container = container;
    console.log('Container exposed for testing');
}

const app = new App({
    target: document.getElementById('app'),
    props: {
        services
    }
});

export default app;

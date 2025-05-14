import App from './MealLoggerApp.svelte';
import container from './container.js';

// Debug environment information
console.log('----------------------------------------');
console.log('Environment Debug Information:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`Environment: ${process.env.NODE_ENV === 'production' ? 'prod' : (process.env.NODE_ENV === 'development' ? 'dev' : 'test')}`);

// Get the services from the container using generic names
const services = {
    database: container.resolve('database'),
    imageHosting: container.resolve('imageHosting'),
    imageSearch: container.resolve('imageSearch')
};

const app = new App({
    target: document.getElementById('app'),
    props: {
        services
    }
});

export default app;

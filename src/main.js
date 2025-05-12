import App from './MealLoggerApp.svelte';
import container from './container.js';

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

import App from './MealLoggerApp.svelte';
import container from './container.js';

// Get the services from the container
const services = {
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

# UltraFood - Food Tracking App

A simple food tracking application optimized for mobile devices with large UI elements, running with Docker Compose or on GitHub Pages.

## Directory Structure

```
📁 ultrafood/
├── 📁 src/
│   ├── 📁 components/
│   ├── 📁 stores/
│   ├── 📁 styles/
│   └── 📄 main.js
├── 📄 Dockerfile
├── 📄 docker-compose.yml
├── 📄 .dockerignore
├── 📄 package.json
└── 📄 README.md
```

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine
- OR Node.js and npm for local development

### Running the App Locally

#### Using Docker

1. Clone or download this repository
2. Open a terminal and navigate to the project directory
3. Run the following command:

```bash
docker-compose up
```

4. Open your browser and go to http://localhost:3123

#### Using npm

1. Clone this repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open your browser and go to http://localhost:3123

### Building for Production

To build the app for production:

```bash
npm run build
```

This generates optimized files in the `dist` directory.

## GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages.

### Deployment Process

The deployment process is automated via GitHub Actions. When you push to the `main` branch, the workflow will:

1. Build the Svelte application
2. Deploy it to GitHub Pages

### Accessing the Deployed App

The app is available at: https://ymitsevich.github.io/ultrafood/

### Manual Deployment

If you want to deploy manually:

1. Build the app: `npm run build`
2. Enable GitHub Pages in your repository settings, using the GitHub Actions option
3. Push to the main branch to trigger the deployment workflow

## Features

- Mobile-friendly design with large UI elements
- Food tracking with tag-based organization
- Firebase integration for data storage
- GitHub Pages hosting
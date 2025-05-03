# Simple Frontend App

A simple frontend application optimized for mobile devices with large UI elements, running with Docker Compose.

## Directory Structure

```
📁 simple-frontend-app/
├── 📁 src/
│   ├── 📁 components/
│   │   └── 📄 App.js
│   ├── 📁 styles/
│   │   └── 📄 main.css
│   ├── 📄 index.html
│   └── 📄 index.js
├── 📄 Dockerfile
├── 📄 docker-compose.yml
├── 📄 .dockerignore
├── 📄 package.json
└── 📄 README.md
```

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine

### Running the App

1. Clone or download this repository
2. Open a terminal and navigate to the project directory
3. Run the following command:

```bash
docker-compose up
```

4. Open your browser and go to http://localhost:3000

### Stopping the App

In the terminal where the app is running, press `Ctrl+C` or run:

```bash
docker-compose down
```

## Features

- Mobile-friendly design with large UI elements
- Simple, lightweight setup
- Live reloading with volume mounting in development
- Containerized for easy deployment and consistent environment
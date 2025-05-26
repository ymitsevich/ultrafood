# Food Tracker Kit (FTK) - Mental Model for GitHub Copilot

## Application Overview

Food Tracker Kit is a modern, progressive web application built with Svelte for meal logging and food tracking. The app allows users to:
- Manage a library of food items with images and metadata
- Log meals by adding foods to a basket with custom amounts
- Track eating history with timestamps
- Export data for analysis
- Manage food categories and search/discover new foods

## Architecture & Design Patterns

### Dependency Injection Pattern
- Uses **Awilix** container for dependency injection (`src/container.js`)
- Services are registered with generic names: `database`, `imageHosting`, `imageSearch`
- Environment-based service selection (production vs test/mock services)
- All components receive services via Svelte context, not direct imports

### Service Layer Architecture
Three main service interfaces with multiple implementations:

#### DatabaseService
- **Production**: `FirebaseDatabaseService` (Firestore)
- **Test/Local**: `InMemoryDatabaseService`
- Handles: food items, submitted meals, pagination, backup/export

#### ImageHostingService  
- **Production**: `CloudinaryImageHostingService`
- **Test/Local**: `LocalImageHostingService`
- Methods: `uploadImage()`, `deleteImage()`, `optimizeUrl()`, `centerObject()`, `enhanceImage()`

#### ImageSearchService
- **Production**: `PixabayImageSearchService` 
- **Test/Local**: `MockImageSearchService`
- Methods: `searchImages()`, `fetchImageAsBlob()`

### Component Architecture
- **Main App**: `MealLoggerApp.svelte` - Root component with state management
- **Sidebar**: `BasketSidebar.svelte` - Shopping cart-style meal building
- **Food Grid**: `FoodGrid.svelte` - Food item display with categories
- **Modals**: Reusable modal components for specific functions
- **Services**: Injected via Svelte context, accessed with `getContext('services')`

## Key Data Models

### Food Item
```javascript
{
  id: string,           // Unique identifier
  name: string,         // Display name
  tags: string[],       // Tag-based categorization
  imageUrl?: string,    // Hosted image URL
  imageData?: string,   // Local image data URL
  calories?: number,    // Nutritional info
  amount?: string       // When in basket/meal context
}
```

### Submitted Meal
```javascript
{
  id: string,           // Unique identifier  
  timestamp: string,    // ISO datetime string
  items: FoodItem[],    // Array of food items with amounts
}
```

## Core Application Flow

### Food Management
1. Foods organized by categories (now transitioning to tag-based system)
2. "Recent" virtual category shows recently eaten foods
3. Foods can be added via manual entry or image search
4. Images handled through ImageHostingService abstraction

### Meal Logging Process
1. **Food Selection**: Browse categories, click food items
2. **Basket Management**: Foods added to basket (Svelte store)
3. **Amount Configuration**: Modal for specifying quantities
4. **Time Selection**: Choose "now" or custom timestamp
5. **Submission**: Meal saved to database, basket cleared

### Data Persistence
- **Production**: Firebase Firestore with real-time sync
- **Development**: In-memory storage with mock data
- **Export**: JSON/YAML formats with ChatGPT integration
- **Backup**: Full data export with statistics

## UI Patterns & Conventions

### Modal System
- Consistent modal structure across components
- Props: `showModal`, `onSave`, `onDelete`, etc.
- Close via X button or backdrop click
- Form validation with error messaging

### Notification System
- Toast-style notifications (success/error)
- Auto-dismiss after 3 seconds
- Positioned at bottom center
- Uses Svelte transitions for smooth animations

### Responsive Design
- Mobile-first approach
- Sidebar expands on hover (desktop)
- Touch-friendly controls
- Grid layouts adapt to screen size

### State Management
- **Basket**: Svelte store (`src/stores/basket.js`)
- **Language**: Svelte store with i18n support
- **Food Data**: Component-level reactive state
- **Submitted Meals**: Paginated loading with local cache

## Key Files & Directories

### Core Application
- `src/MealLoggerApp.svelte` - Main application component
- `src/main.js` - Application entry point with service injection
- `src/container.js` - Dependency injection configuration

### Components
- `src/components/` - Reusable UI components
- `src/BasketSidebar.svelte` - Meal building interface

### Services
- `src/services/interfaces/` - Service interface definitions
- `src/services/*Service.js` - Service implementations

### Stores
- `src/stores/` - Svelte stores for global state

### Styles
- `src/styles/main.css` - Global styles and CSS variables

## Development Guidelines

### Service Usage
- Always access services via `getContext('services')`
- Use interface methods, not implementation-specific features
- Handle service availability with `database.isAvailable()`

### Error Handling
- Graceful degradation when services unavailable
- User-friendly error messages via notification system
- Fallback to local data when cloud services fail

### Internationalization
- Use `$i18n('key')` for all user-facing text
- Store translations in language store
- Support for multiple languages with dynamic switching

### Testing
- Playwright for E2E testing
- Mock services automatically used in test environment
- Test files in `tests/e2e/`

## Code Conventions

### Naming
- Services use generic names (`database`, not `firebaseDatabase`)
- Components use PascalCase
- Files use camelCase
- CSS classes use kebab-case

### Async/Await
- Prefer async/await over Promises
- Handle errors with try/catch blocks
- Show loading states during async operations

### Reactivity
- Use `$:` for reactive statements
- Create new object references to trigger reactivity
- Prefer stores for cross-component state

### Event Handling
- Use callback props for parent-child communication
- Event names use camelCase (onSave, onDelete)
- Pass minimal data in event callbacks

## Performance Considerations

### Image Optimization
- Cloudinary transformations for different sizes
- Lazy loading for image grids
- Local caching in development

### Data Loading
- Pagination for large datasets (meals)
- Virtual "Recent" category for performance
- Debounced search inputs

### Bundle Size
- Minimal dependencies
- Tree-shaking friendly imports
- Service worker for caching (via Vite)

## Environment Configuration

### Development
- Uses mock/local services
- Hot reload via Vite
- Console logging enabled

### Production
- Real services (Firebase, Cloudinary, Pixabay)
- Environment variables for API keys
- Error tracking and monitoring

This mental model should help GitHub Copilot understand the application's architecture, patterns, and conventions when providing code suggestions and assistance.
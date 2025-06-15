# Frontend Specification - React SSR with Vite

## Overview
Server-side rendered React stocks application using Vite SSR that pre-renders pages on the server without database integration.

## Architecture
- **Framework**: React with Vite SSR
- **Routing**: React Router with SSR support
- **Port**: 3000 (Vite dev server with SSR)
- **Data Storage**: Static data files (JSON/JS modules)
- **Build**: Vite production build with SSR

## Routes (React Router)

### / (Home Route)
- **Component**: HomePage
- **Purpose**: Displays list of stock symbols
- **Data**: Static list of stock symbols
- **Features**: Plain text stock symbol list, navigation to individual articles

### /stock/:symbol (Stock Article Route)
- **Component**: StockPage
- **Purpose**: Displays individual stock article
- **Data**: Static article content and stock information
- **Features**: Article content, stock info, back to home navigation
- **Error**: 404 component for non-existent stock symbols


## File Structure
```
apps/
  stocks/
    package.json
    vite.config.ts
    src/
      main.tsx
      App.tsx
      entry-server.tsx
      entry-client.tsx
      components/
        HomePage.tsx
        StockPage.tsx
        NotFound.tsx
        Layout.tsx
      data/
        stockData.ts
      styles/
        main.css
    index.html
    .gitignore
```

## Component Structure

### App.tsx (Main App)
- React Router setup
- Route definitions
- Error boundaries

### Layout.tsx (Shared Layout)
- Common header/footer structure
- Navigation components
- Outlet for route content

### HomePage.tsx
- Stock symbol list display
- Plain text list of stock symbols
- Link components to individual stock articles

### StockPage.tsx
- Article content display
- Stock information header
- Article text with proper formatting
- Back navigation
- useParams for stock symbol

### NotFound.tsx
- 404 error component
- Back to home navigation

## Mock Data Structure
- **Stock Symbols**: Array of stock symbols (e.g., ["AAPL", "GOOGL", "MSFT"])
- **Article Content**: Object mapping symbols to full article content
- **Stock Info**: Basic stock information (symbol, company name, current price)

## Dependencies
- react: UI library
- react-dom: DOM rendering
- react-router-dom: Client-side routing
- vite: Build tool and dev server
- @vitejs/plugin-react: React support for Vite
- typescript: Type checking

## Scripts
- `npm run dev`: Development server with SSR
- `npm run build`: Production build
- `npm run preview`: Preview production build
- `npm run build:client`: Build client bundle
- `npm run build:server`: Build server bundle

## SSR Configuration
- entry-client.tsx: Client-side hydration
- entry-server.tsx: Server-side rendering
- vite.config.ts: SSR build configuration
- index.html: SSR template

## Data Loading
- Static imports in components
- Pre-rendered data at build time
- No runtime API calls needed

## Styling
- CSS modules or styled-components
- Responsive design
- Simple list styling for stock symbols
- Typography for article readability
- Navigation components
- Mobile-friendly layout
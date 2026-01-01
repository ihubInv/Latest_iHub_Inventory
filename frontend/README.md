# iHub Inventory Management System - Frontend

A modern React-based frontend for the iHub Inventory Management System, built with Vite, TypeScript, Redux Toolkit Query, and Tailwind CSS.

## Features

- **Role-based Access Control**: Support for Admin, Stock Manager, and Employee roles
- **Modern UI**: Built with Tailwind CSS for responsive and beautiful interfaces
- **State Management**: Redux Toolkit Query for efficient API state management
- **Type Safety**: Full TypeScript support
- **Authentication**: JWT-based authentication with automatic token refresh
- **Real-time Updates**: Optimistic updates and cache invalidation

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Redux Toolkit Query** - API state management
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running on port 5002

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```env
VITE_BACKEND_URL=http://localhost:5002/api
VITE_APP_NAME=iHub Inventory Management System
VITE_APP_VERSION=1.0.0
```

4. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Page components
├── store/              # Redux store and slices
│   ├── api/            # RTK Query API slices
│   └── slices/         # Redux slices
├── types/              # TypeScript type definitions
└── App.tsx             # Main App component
```

## API Integration

The frontend uses Redux Toolkit Query for API integration with the following features:

- **Automatic Caching**: API responses are cached automatically
- **Background Refetching**: Data is refreshed in the background
- **Optimistic Updates**: UI updates immediately for better UX
- **Error Handling**: Centralized error handling
- **Loading States**: Built-in loading state management

### Available API Slices

- `authApi` - Authentication endpoints
- `usersApi` - User management
- `inventoryApi` - Inventory management
- `requestsApi` - Request management
- `locationsApi` - Location management
- `categoriesApi` - Category management
- `assetsApi` - Asset management
- `transactionsApi` - Transaction management
- `dashboardApi` - Dashboard analytics
- `notificationsApi` - Notification management

## Role-based Access

The application supports three user roles:

### Admin
- Full system access
- User management
- System configuration
- All inventory operations

### Stock Manager
- Inventory management
- Request approval
- Location management
- Category and asset management

### Employee
- View inventory
- Create requests
- View own requests
- Basic dashboard access

## Development

### Adding New Components

1. Create component in appropriate directory
2. Export from index file if needed
3. Add TypeScript types
4. Include in storybook if applicable

### Adding New API Endpoints

1. Add endpoint to appropriate API slice
2. Define TypeScript types
3. Add to tag types for cache invalidation
4. Export hooks for component use

### Styling Guidelines

- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Use consistent spacing and colors
- Maintain accessibility standards

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests if applicable
5. Submit pull request

## License

This project is licensed under the MIT License.
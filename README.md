# Production Management System

A full-stack web application built with .NET 8 Web API and React TypeScript frontend for managing products and orders.

## Project Structure

```
ProductionManagement/
├── ProductionManagement.API/          # .NET 8 Web API
│   ├── Controllers/                   # API Controllers
│   ├── Models/                        # Data Models
│   └── Program.cs                     # Application entry point
└── production-management-frontend/    # React TypeScript Frontend
    ├── src/
    │   ├── components/                # React Components
    │   ├── services/                  # API Service Layer
    │   └── types/                     # TypeScript Interfaces
    └── package.json
```

## Features

### Backend (.NET 8 Web API)
- **Products Management**: CRUD operations for products
- **Orders Management**: Create and manage orders with status updates
- **CORS Configuration**: Configured to allow requests from React frontend
- **Swagger Documentation**: API documentation available at `/swagger`

### Frontend (React TypeScript)
- **Products Tab**: View, add, and delete products
- **Orders Tab**: View orders and update order status
- **Responsive Design**: Modern, mobile-friendly interface
- **TypeScript**: Full type safety throughout the application

## Prerequisites

- .NET 8 SDK
- Node.js (v16 or higher)
- npm or yarn

## Getting Started

### 1. Start the Backend API

```bash
# Navigate to the API directory
cd ProductionManagement.API

# Restore packages
dotnet restore

# Run the API
dotnet run
```

The API will be available at:
- HTTPS: `https://localhost:7000`
- HTTP: `http://localhost:5000`
- Swagger UI: `https://localhost:7000/swagger`

### 2. Start the Frontend

```bash
# Navigate to the frontend directory
cd production-management-frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The React app will be available at `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/{id}` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/{id}/status` - Update order status

## Sample Data

The API comes with sample data:
- 3 sample products (Laptop, Mouse, Keyboard)
- 1 sample order with order items

## Development

### Backend Development
- The API uses in-memory data storage (no database required)
- Controllers are located in `Controllers/` directory
- Models are defined in `Models/` directory
- CORS is configured to allow requests from `http://localhost:3000`

### Frontend Development
- Components are located in `src/components/`
- API service layer is in `src/services/api.ts`
- TypeScript interfaces are in `src/types/index.ts`
- Styling uses CSS modules for component-specific styles

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the API is running on the correct port (7000 for HTTPS)
2. **API Connection Issues**: Verify the API URL in `src/services/api.ts`
3. **Port Conflicts**: If port 3000 is occupied, React will prompt to use a different port

### SSL Certificate Issues
If you encounter SSL certificate issues with the API:
```bash
dotnet dev-certs https --trust
```

## Next Steps

To extend this application, consider:
- Adding a database (Entity Framework Core)
- Implementing authentication and authorization
- Adding more business logic and validation
- Creating more sophisticated UI components
- Adding unit tests
- Implementing real-time updates with SignalR

## Technologies Used

### Backend
- .NET 8
- ASP.NET Core Web API
- C#

### Frontend
- React 18
- TypeScript
- Axios for HTTP requests
- CSS3 for styling

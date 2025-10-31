# Production Management System

A full-stack enterprise application for managing acquisitions, inventory, production plans, and orders with role-based access control and email notifications.

## 🏗️ Architecture

- **Backend**: ASP.NET Core 9.0 Web API with Entity Framework Core
- **Frontend**: React 18 + TypeScript (Vite)
- **Database**: SQL Server (LocalDB)
- **Authentication**: JWT Bearer Token
- **Email Service**: Brevo (Sendinblue) API

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **.NET 9.0 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/9.0)
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **SQL Server LocalDB** - Included with Visual Studio or [download standalone](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb)
- **Git** (optional) - For version control

### Verify Prerequisites

```bash
# Check .NET version
dotnet --version

# Check Node.js version
node --version

# Check npm version
npm --version

# Verify LocalDB installation
sqllocaldb info
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ProductionManagement
```

### 2. Database Setup

#### Option A: Automatic Setup (Recommended)

```bash
# Navigate to the API directory
cd ProductionManagement.API

# Restore NuGet packages
dotnet restore

# Create the database with initial migration
dotnet ef database update

# The database will be created with:
# - All tables and relationships
# - Default roles (Admin, Manager, User, Supervisor, Warehouse Operator)
# - Default permissions for each role
# - Sample inventory data (3 raw materials)
# - Admin user (username: admin, password: admin123)
```

#### Option B: Manual Database Reset

If you need to reset the database:

```bash
cd ProductionManagement.API

# Drop the existing database
dotnet ef database drop --force

# Create a new migration (if not exists)
dotnet ef migrations add InitialCreate

# Apply the migration
dotnet ef database update
```

#### Option C: Fresh Migration Setup

To start with a completely clean migration:

```bash
cd ProductionManagement.API

# Remove all existing migrations
Remove-Item -Path "Migrations\*" -Recurse -Force  # PowerShell
# OR
rm -rf Migrations/*  # Linux/Mac

# Drop the database
dotnet ef database drop --force

# Create initial migration
dotnet ef migrations add InitialCreate

# Create and seed database
dotnet ef database update
```

### 3. Email Service Configuration (Optional)

To enable email notifications, configure Brevo API:

1. Sign up for a free account at [Brevo](https://www.brevo.com/)
2. Get your API key from Settings → SMTP & API
3. Create or update `ProductionManagement.API/appsettings.Development.json`:

```json
{
  "Brevo": {
    "ApiKey": "your-brevo-api-key-here",
    "SenderEmail": "your-verified-sender@email.com",
    "SenderName": "Production Management System"
  }
}
```

**Note**: The `appsettings.Development.json` file is gitignored for security. Never commit API keys to version control.

### 4. Start the Backend API

```bash
# From the ProductionManagement.API directory
dotnet build

# Run the API
dotnet run
```

The API will be available at:
- **HTTPS**: `https://localhost:7000`
- **HTTP**: `http://localhost:5000`
- **Swagger UI**: `https://localhost:7000/swagger`

### 5. Start the Frontend

Open a new terminal:

```bash
# Navigate to the frontend directory
cd production-management-frontend-vite

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

The application will be available at:
- **Frontend**: `http://localhost:5173`

## 🔐 Default Login Credentials

```
Username: admin
Password: admin123
```

**⚠️ Important**: Change the admin password immediately in production environments!

## 📦 Project Structure

```
ProductionManagement/
├── ProductionManagement.API/              # Backend API
│   ├── Controllers/                       # API Controllers
│   │   ├── AcquisitionController.cs      # Acquisitions management
│   │   ├── AuthController.cs             # Authentication & user registration
│   │   ├── InventoryController.cs        # Raw materials inventory
│   │   ├── ProductionController.cs       # Products & production
│   │   ├── ProductionPlanController.cs   # Production planning
│   │   ├── OrderController.cs            # Customer orders
│   │   ├── UserController.cs             # User management
│   │   ├── RolePermissionController.cs   # Roles & permissions
│   │   └── ... (others)
│   ├── Models/                            # Data models
│   │   ├── Acquisition.cs
│   │   ├── User.cs
│   │   ├── Permission.cs
│   │   └── ... (others)
│   ├── Data/                              # Database context
│   │   └── ApplicationDbContext.cs
│   ├── Repositories/                      # Data access layer
│   ├── Services/                          # Business logic & services
│   │   ├── IEmailService.cs
│   │   └── BrevoEmailService.cs
│   ├── Authorization/                     # Custom authorization
│   │   ├── PermissionRequirement.cs
│   │   ├── PermissionAuthorizationHandler.cs
│   │   └── RequirePermissionAttribute.cs
│   ├── Migrations/                        # EF Core migrations
│   ├── appsettings.json                   # Application settings
│   ├── appsettings.Development.json       # Dev settings (gitignored)
│   └── Program.cs                         # App entry point
│
└── production-management-frontend-vite/   # Frontend (React + Vite)
    ├── src/
    │   ├── components/                    # React components
    │   │   ├── acquisitions/
    │   │   ├── inventory/
    │   │   ├── production/
    │   │   ├── orders/
    │   │   ├── users/
    │   │   ├── Dashboard.tsx
    │   │   ├── Login.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── ProtectedButton.tsx
    │   ├── hooks/                         # Custom React hooks
    │   │   └── usePermissions.ts
    │   ├── services/                      # API service layer
    │   │   └── api.ts
    │   ├── types.ts                       # TypeScript interfaces
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

## 🎯 Key Features

### User Management & Security
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Granular permission system
- ✅ Custom role creation
- ✅ User email notification preferences

### Acquisitions Management
- ✅ Create and track material acquisitions
- ✅ Supplier integration
- ✅ Transport management
- ✅ Status workflow (Pending → Received → Processing → Processed/Cancelled)
- ✅ Email notifications on create/update/delete

### Inventory Management
- ✅ Raw materials tracking
- ✅ Stock levels and alerts
- ✅ Material types and categories
- ✅ Activate/deactivate materials

### Production Management
- ✅ Production plan creation
- ✅ Material requirements calculation
- ✅ Production tracking
- ✅ Cost estimation

### Order Management
- ✅ Customer order processing
- ✅ Order status tracking
- ✅ Delivery management

### Email Notifications
- ✅ Welcome emails for new users
- ✅ Acquisition created notifications
- ✅ Acquisition updated notifications (with change tracking)
- ✅ Acquisition deleted notifications
- ✅ Customizable email templates

## 🔑 Environment Variables

### Backend (appsettings.Development.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=ProductionManagementDb;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "JwtSettings": {
    "SecretKey": "your-super-secret-key-min-32-characters",
    "Issuer": "ProductionManagementAPI",
    "Audience": "ProductionManagementClient",
    "ExpirationMinutes": 60
  },
  "Brevo": {
    "ApiKey": "your-brevo-api-key",
    "SenderEmail": "noreply@yourdomain.com",
    "SenderName": "Production Management"
  }
}
```

### Frontend (.env)

```env
VITE_API_URL=https://localhost:7000
```

## 🛠️ Development Commands

### Backend

```bash
# Build the project
dotnet build

# Run the project
dotnet run

# Run with hot reload
dotnet watch run

# Create a new migration
dotnet ef migrations add <MigrationName>

# Update database
dotnet ef database update

# Rollback migration
dotnet ef database update <PreviousMigrationName>

# Drop database
dotnet ef database drop
```

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📊 Database Schema

Key tables:
- **Users** - User accounts with roles and email preferences
- **Roles** - System and custom roles
- **RolePermissions** - Permission assignments to roles
- **Acquisitions** - Material acquisition requests
- **AcquisitionItems** - Individual items in acquisitions
- **AcquisitionHistories** - Audit trail for acquisitions
- **RawMaterials** - Inventory items
- **Products** - Finished products
- **ProductionPlans** - Production planning
- **Orders** - Customer orders
- **Suppliers** - Supplier information
- **Transports** - Transport vehicles
- **Clients** - Customer information

## 🔐 Roles & Permissions

### System Roles

1. **Admin**
   - Full system access
   - User and role management
   - All module permissions

2. **Manager**
   - Manage all operations
   - Create/Edit/View all modules
   - No user administration

3. **User**
   - View-only access
   - Read permissions for all modules

### Custom Roles (Examples)

4. **Supervisor**
   - Production and inventory management
   - Order management
   - Limited administrative access

5. **Warehouse Operator**
   - Inventory and acquisition management
   - No production or order access

### Permission Categories

- **Acquisitions**: ViewTab, Create, View, Edit, Cancel, Receive, Process
- **Inventory**: ViewTab, Add, Edit, View, Deactivate, Activate
- **Production**: ViewTab, Create, Edit, View, Cancel, Execute, Receive
- **Orders**: ViewTab, Create, Edit, View, Cancel, Process
- **Users**: ViewTab, Create, Edit, View, Deactivate, Activate
- **Roles**: ViewTab, ManagePermissions

## 🐛 Troubleshooting

### Database Issues

**Connection Failed:**
```bash
# Verify LocalDB is running
sqllocaldb info mssqllocaldb

# Start LocalDB if stopped
sqllocaldb start mssqllocaldb
```

**Migration Errors:**
```bash
# Reset migrations and database
dotnet ef database drop --force
Remove-Item -Path "Migrations\*" -Recurse -Force
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### API Issues

**CORS Errors:**
- Verify frontend URL matches CORS configuration in `Program.cs`
- Default: `http://localhost:5173`

**SSL Certificate Issues:**
```bash
dotnet dev-certs https --trust
```

**Port Already in Use:**
```bash
# Change ports in launchSettings.json or use:
dotnet run --urls "https://localhost:7001;http://localhost:5001"
```

### Frontend Issues

**API Connection Failed:**
- Verify API is running
- Check `src/services/api.ts` has correct API URL
- Check browser console for CORS errors

**Module Not Found:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 API Documentation

When the API is running, visit:
- **Swagger UI**: `https://localhost:7000/swagger`

All endpoints are documented with:
- Request/Response schemas
- Parameter descriptions
- Authentication requirements
- Example values

## 🧪 Testing

### Backend Tests
```bash
cd ProductionManagement.API
dotnet test
```

### Frontend Tests
```bash
cd production-management-frontend-vite
npm run test
```

## 📈 Next Steps

Potential enhancements:
- [ ] Unit and integration tests
- [ ] API rate limiting
- [ ] Audit logging system
- [ ] Real-time notifications (SignalR)
- [ ] File upload for documents
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] Mobile responsive improvements
- [ ] PWA capabilities

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review API documentation at `/swagger`
3. Contact the development team

---

**Last Updated**: October 31, 2024
**Version**: 1.0.0

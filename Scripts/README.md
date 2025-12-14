# Production Management Scripts

This folder contains utility scripts for managing the Production Management system.

## Available Scripts

### SeedRolePermissions.ps1

Seeds the default role permissions for all system roles (ADMIN, COORDONATOR VANZARI, AGENT TEREN, ACHIZITIONER, MAGAZIONER).

**Usage:**
```powershell
cd Scripts
.\SeedRolePermissions.ps1
```

**What it does:**
- Logs in as admin user
- Calls the `/api/rolepermission/seed` endpoint
- Seeds permissions for:
  - **ADMIN**: All permissions (full system access)
  - **COORDONATOR VANZARI**: Most permissions except user and role management
  - **AGENT TEREN**: Basic view-only permissions
  - **ACHIZITIONER**: Production, Inventory, Orders and Acquisitions
  - **MAGAZIONER**: Inventory and Acquisitions only

**Prerequisites:**
- API must be running on `http://localhost:5000`
- Admin user must exist (default: `admin` / `admin123`)

**When to use:**
- After a fresh database creation
- When role permissions need to be reset
- When updating permission definitions

---

## Automatic Seeding

The database seed method in `ApplicationDbContext.cs` automatically creates:
- Default system roles (ADMIN, COORDONATOR VANZARI, AGENT TEREN)
- Custom roles (ACHIZITIONER, MAGAZIONER)
- All role permissions for all roles

This runs automatically when creating a **new database** from scratch using:
```bash
cd ProductionManagement.API
dotnet ef database update
```

## Notes

- The PowerShell script is provided as a manual alternative when you need to re-seed permissions without recreating the database
- Custom roles created through the UI will retain their permissions
- System roles (ADMIN, COORDONATOR VANZARI, AGENT TEREN) cannot be deleted but their permissions can be modified
- The seeding process will clear existing permissions and recreate them


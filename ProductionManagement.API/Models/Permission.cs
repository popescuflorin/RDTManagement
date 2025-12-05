namespace ProductionManagement.API.Models
{
    // Permission categories and their specific permissions
    public static class Permissions
    {
        // Acquisitions
        public const string ViewAcquisitionsTab = "Acquisitions.ViewTab";
        public const string CreateAcquisition = "Acquisitions.Create";
        public const string ViewAcquisition = "Acquisitions.View";
        public const string EditAcquisition = "Acquisitions.Edit";
        public const string CancelAcquisition = "Acquisitions.Cancel";
        public const string ReceiveAcquisition = "Acquisitions.Receive";
        public const string ProcessAcquisition = "Acquisitions.Process";

        // Inventory
        public const string ViewInventoryTab = "Inventory.ViewTab";
        public const string AddMaterial = "Inventory.Add";
        public const string EditMaterial = "Inventory.Edit";
        public const string ViewMaterial = "Inventory.View";
        public const string DeactivateMaterial = "Inventory.Deactivate";
        public const string ActivateMaterial = "Inventory.Activate";

        // Production
        public const string ViewProductionTab = "Production.ViewTab";
        public const string CreateProductionPlan = "Production.Create";
        public const string EditProductionPlan = "Production.Edit";
        public const string ViewProductionPlan = "Production.View";
        public const string CancelProductionPlan = "Production.Cancel";
        public const string ExecuteProduction = "Production.Execute";
        public const string ReceiveProduction = "Production.Receive";

        // Orders
        public const string ViewOrdersTab = "Orders.ViewTab";
        public const string CreateOrder = "Orders.Create";
        public const string EditOrder = "Orders.Edit";
        public const string ViewOrder = "Orders.View";
        public const string CancelOrder = "Orders.Cancel";
        public const string ProcessOrder = "Orders.Process";

        // Users
        public const string ViewUsersTab = "Users.ViewTab";
        public const string CreateUser = "Users.Create";
        public const string EditUser = "Users.Edit";
        public const string ViewUser = "Users.View";
        public const string DeactivateUser = "Users.Deactivate";
        public const string ActivateUser = "Users.Activate";

        // Transport
        public const string ViewTransportsTab = "Transports.ViewTab";
        public const string CreateTransport = "Transports.Create";
        public const string ViewTransport = "Transports.View";
        public const string EditTransport = "Transports.Edit";
        public const string DeleteTransport = "Transports.Delete";

        // Clients
        public const string ViewClientsTab = "Clients.ViewTab";
        public const string CreateClient = "Clients.Create";
        public const string ViewClient = "Clients.View";
        public const string EditClient = "Clients.Edit";
        public const string DeleteClient = "Clients.Delete";

        // Suppliers
        public const string ViewSuppliersTab = "Suppliers.ViewTab";
        public const string CreateSupplier = "Suppliers.Create";
        public const string ViewSupplier = "Suppliers.View";
        public const string EditSupplier = "Suppliers.Edit";
        public const string DeleteSupplier = "Suppliers.Delete";

        // Roles & Permissions
        public const string ViewRolesTab = "Roles.ViewTab";
        public const string ManageRolePermissions = "Roles.ManagePermissions";

        // Get all permissions as a list
        public static List<string> GetAllPermissions()
        {
            return new List<string>
            {
                // Acquisitions
                ViewAcquisitionsTab, CreateAcquisition, ViewAcquisition, EditAcquisition,
                CancelAcquisition, ReceiveAcquisition, ProcessAcquisition,
                
                // Inventory
                ViewInventoryTab, AddMaterial, EditMaterial, ViewMaterial,
                DeactivateMaterial, ActivateMaterial,
                
                // Production
                ViewProductionTab, CreateProductionPlan, EditProductionPlan, ViewProductionPlan,
                CancelProductionPlan, ExecuteProduction, ReceiveProduction,
                
                // Orders
                ViewOrdersTab, CreateOrder, EditOrder, ViewOrder,
                CancelOrder, ProcessOrder,
                
                // Users
                ViewUsersTab, CreateUser, EditUser, ViewUser,
                DeactivateUser, ActivateUser,
                
                // Transport
                ViewTransportsTab, CreateTransport, ViewTransport, EditTransport, DeleteTransport,
                
                // Clients
                ViewClientsTab, CreateClient, ViewClient, EditClient, DeleteClient,
                
                // Suppliers
                ViewSuppliersTab, CreateSupplier, ViewSupplier, EditSupplier, DeleteSupplier,
                
                // Roles
                ViewRolesTab, ManageRolePermissions
            };
        }

        // Get permissions grouped by category
        public static Dictionary<string, List<PermissionInfo>> GetPermissionsByCategory()
        {
            return new Dictionary<string, List<PermissionInfo>>
            {
                ["Acquisitions"] = new List<PermissionInfo>
                {
                    new PermissionInfo { Key = ViewAcquisitionsTab, Name = "View Acquisitions Tab", Description = "Access to the acquisitions module" },
                    new PermissionInfo { Key = CreateAcquisition, Name = "Create Acquisition", Description = "Create new acquisitions" },
                    new PermissionInfo { Key = ViewAcquisition, Name = "View Acquisition", Description = "View acquisition details" },
                    new PermissionInfo { Key = EditAcquisition, Name = "Edit Acquisition", Description = "Edit existing acquisitions" },
                    new PermissionInfo { Key = CancelAcquisition, Name = "Cancel Acquisition", Description = "Cancel acquisitions" },
                    new PermissionInfo { Key = ReceiveAcquisition, Name = "Receive Acquisition", Description = "Receive materials from acquisitions" },
                    new PermissionInfo { Key = ProcessAcquisition, Name = "Process Acquisition", Description = "Process recyclable materials" }
                },
                ["Inventory"] = new List<PermissionInfo>
                {
                    new PermissionInfo { Key = ViewInventoryTab, Name = "View Inventory Tab", Description = "Access to the inventory module" },
                    new PermissionInfo { Key = AddMaterial, Name = "Add Material", Description = "Add new materials to inventory" },
                    new PermissionInfo { Key = EditMaterial, Name = "Edit Material", Description = "Edit existing materials" },
                    new PermissionInfo { Key = ViewMaterial, Name = "View Material", Description = "View material details" },
                    new PermissionInfo { Key = DeactivateMaterial, Name = "Deactivate Material", Description = "Deactivate materials" },
                    new PermissionInfo { Key = ActivateMaterial, Name = "Activate Material", Description = "Activate inactive materials" }
                },
                ["Production"] = new List<PermissionInfo>
                {
                    new PermissionInfo { Key = ViewProductionTab, Name = "View Production Tab", Description = "Access to the production module" },
                    new PermissionInfo { Key = CreateProductionPlan, Name = "Create Production Plan", Description = "Create new production plans" },
                    new PermissionInfo { Key = EditProductionPlan, Name = "Edit Production Plan", Description = "Edit existing production plans" },
                    new PermissionInfo { Key = ViewProductionPlan, Name = "View Production Plan", Description = "View production plan details" },
                    new PermissionInfo { Key = CancelProductionPlan, Name = "Cancel Production Plan", Description = "Cancel production plans" },
                    new PermissionInfo { Key = ExecuteProduction, Name = "Execute Production", Description = "Start production execution" },
                    new PermissionInfo { Key = ReceiveProduction, Name = "Receive Production", Description = "Receive produced materials" }
                },
                ["Orders"] = new List<PermissionInfo>
                {
                    new PermissionInfo { Key = ViewOrdersTab, Name = "View Orders Tab", Description = "Access to the orders module" },
                    new PermissionInfo { Key = CreateOrder, Name = "Create Order", Description = "Create new orders" },
                    new PermissionInfo { Key = EditOrder, Name = "Edit Order", Description = "Edit existing orders" },
                    new PermissionInfo { Key = ViewOrder, Name = "View Order", Description = "View order details" },
                    new PermissionInfo { Key = CancelOrder, Name = "Cancel Order", Description = "Cancel orders" },
                    new PermissionInfo { Key = ProcessOrder, Name = "Process Order", Description = "Process and fulfill orders" }
                },
                ["Users"] = new List<PermissionInfo>
                {
                    new PermissionInfo { Key = ViewUsersTab, Name = "View Users Tab", Description = "Access to the user management module" },
                    new PermissionInfo { Key = CreateUser, Name = "Create User", Description = "Create new user accounts" },
                    new PermissionInfo { Key = EditUser, Name = "Edit User", Description = "Edit existing users" },
                    new PermissionInfo { Key = ViewUser, Name = "View User", Description = "View user details" },
                    new PermissionInfo { Key = DeactivateUser, Name = "Deactivate User", Description = "Deactivate user accounts" },
                    new PermissionInfo { Key = ActivateUser, Name = "Activate User", Description = "Activate inactive users" }
                },
                ["Transport"] = new List<PermissionInfo>
                {
                    new PermissionInfo { Key = ViewTransportsTab, Name = "View Transports Tab", Description = "Access to the transport management module" },
                    new PermissionInfo { Key = CreateTransport, Name = "Create Transport", Description = "Create new transport vehicles" },
                    new PermissionInfo { Key = ViewTransport, Name = "View Transport", Description = "View transport details" },
                    new PermissionInfo { Key = EditTransport, Name = "Edit Transport", Description = "Edit existing transport vehicles" },
                    new PermissionInfo { Key = DeleteTransport, Name = "Delete Transport", Description = "Delete transport vehicles" }
                },
                ["Clients"] = new List<PermissionInfo>
                {
                    new PermissionInfo { Key = ViewClientsTab, Name = "View Clients Tab", Description = "Access to the client management module" },
                    new PermissionInfo { Key = CreateClient, Name = "Create Client", Description = "Create new client accounts" },
                    new PermissionInfo { Key = ViewClient, Name = "View Client", Description = "View client details" },
                    new PermissionInfo { Key = EditClient, Name = "Edit Client", Description = "Edit existing clients" },
                    new PermissionInfo { Key = DeleteClient, Name = "Delete Client", Description = "Deactivate client accounts" }
                },
                ["Suppliers"] = new List<PermissionInfo>
                {
                    new PermissionInfo { Key = ViewSuppliersTab, Name = "View Suppliers Tab", Description = "Access to the supplier management module" },
                    new PermissionInfo { Key = CreateSupplier, Name = "Create Supplier", Description = "Create new supplier accounts" },
                    new PermissionInfo { Key = ViewSupplier, Name = "View Supplier", Description = "View supplier details" },
                    new PermissionInfo { Key = EditSupplier, Name = "Edit Supplier", Description = "Edit existing suppliers" },
                    new PermissionInfo { Key = DeleteSupplier, Name = "Delete Supplier", Description = "Deactivate supplier accounts" }
                },
                ["Roles & Permissions"] = new List<PermissionInfo>
                {
                    new PermissionInfo { Key = ViewRolesTab, Name = "View Roles Tab", Description = "Access to the role management module" },
                    new PermissionInfo { Key = ManageRolePermissions, Name = "Manage Role Permissions", Description = "Assign permissions to roles" }
                }
            };
        }
    }

    public class PermissionInfo
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class RolePermission
    {
        public int Id { get; set; }
        public string Role { get; set; } = string.Empty;
        public string Permission { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string CreatedByUserId { get; set; } = string.Empty;
    }

    public class RolePermissionsDto
    {
        public string Role { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new List<string>();
    }

    public class UpdateRolePermissionsRequest
    {
        public string Role { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new List<string>();
    }
}


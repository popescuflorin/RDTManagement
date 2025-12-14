using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ADMIN")]
    public class RolePermissionController : ControllerBase
    {
        private readonly IRolePermissionRepository _rolePermissionRepository;
        private readonly ApplicationDbContext _context;

        public RolePermissionController(IRolePermissionRepository rolePermissionRepository, ApplicationDbContext context)
        {
            _rolePermissionRepository = rolePermissionRepository;
            _context = context;
        }

        // GET: api/rolepermission/permissions
        [HttpGet("permissions")]
        public ActionResult<Dictionary<string, List<PermissionInfo>>> GetAllPermissions()
        {
            var permissions = Permissions.GetPermissionsByCategory();
            return Ok(permissions);
        }

        // GET: api/rolepermission/roles
        [HttpGet("roles")]
        public async Task<ActionResult<List<RoleDto>>> GetAllRoles()
        {
            var roles = await _context.Roles
                .OrderBy(r => r.IsSystemRole ? 0 : 1)
                .ThenBy(r => r.Name)
                .ToListAsync();

            var roleDtos = roles.Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                IsSystemRole = r.IsSystemRole,
                CreatedAt = r.CreatedAt
            }).ToList();

            return Ok(roleDtos);
        }

        // GET: api/rolepermission/{role}
        [HttpGet("{role}")]
        public async Task<ActionResult<RolePermissionsDto>> GetRolePermissions(string role)
        {
            var permissions = await _rolePermissionRepository.GetPermissionsByRoleAsync(role);
            
            var dto = new RolePermissionsDto
            {
                Role = role,
                Permissions = permissions.ToList()
            };

            return Ok(dto);
        }

        // PUT: api/rolepermission/{role}
        [HttpPut("{role}")]
        public async Task<ActionResult<RolePermissionsDto>> UpdateRolePermissions(string role, [FromBody] UpdateRolePermissionsRequest request)
        {
            if (role != request.Role)
            {
                return BadRequest(new { message = "Role mismatch" });
            }

            // Validate permissions
            var allPermissions = Permissions.GetAllPermissions();
            var invalidPermissions = request.Permissions.Where(p => !allPermissions.Contains(p)).ToList();
            if (invalidPermissions.Any())
            {
                return BadRequest(new { message = $"Invalid permissions: {string.Join(", ", invalidPermissions)}" });
            }

            // Delete existing permissions for the role
            await _rolePermissionRepository.DeleteByRoleAsync(role);

            // Add new permissions
            foreach (var permission in request.Permissions)
            {
                var rolePermission = new RolePermission
                {
                    Role = role,
                    Permission = permission,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = User.Identity?.Name ?? "System"
                };
                await _rolePermissionRepository.AddAsync(rolePermission);
            }

            await _context.SaveChangesAsync();

            var dto = new RolePermissionsDto
            {
                Role = role,
                Permissions = request.Permissions
            };

            return Ok(dto);
        }

        // POST: api/rolepermission/roles
        [HttpPost("roles")]
        public async Task<ActionResult<RoleDto>> CreateRole([FromBody] CreateRoleRequest request)
        {
            // Validate role name
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Role name is required" });
            }

            // Check if role already exists
            var existingRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == request.Name);
            if (existingRole != null)
            {
                return BadRequest(new { message = $"Role '{request.Name}' already exists" });
            }

            // Validate permissions
            var allPermissions = Permissions.GetAllPermissions();
            var invalidPermissions = request.Permissions.Where(p => !allPermissions.Contains(p)).ToList();
            if (invalidPermissions.Any())
            {
                return BadRequest(new { message = $"Invalid permissions: {string.Join(", ", invalidPermissions)}" });
            }

            // Create role
            var role = new Role
            {
                Name = request.Name,
                Description = request.Description,
                IsSystemRole = false,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = User.Identity?.Name ?? "System"
            };

            _context.Roles.Add(role);
            await _context.SaveChangesAsync();

            // Add permissions
            foreach (var permission in request.Permissions)
            {
                var rolePermission = new RolePermission
                {
                    Role = role.Name,
                    Permission = permission,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = User.Identity?.Name ?? "System"
                };
                await _rolePermissionRepository.AddAsync(rolePermission);
            }

            await _context.SaveChangesAsync();

            var roleDto = new RoleDto
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                IsSystemRole = role.IsSystemRole,
                CreatedAt = role.CreatedAt
            };

            return CreatedAtAction(nameof(GetRolePermissions), new { role = role.Name }, roleDto);
        }

        // DELETE: api/rolepermission/roles/{roleId}
        [HttpDelete("roles/{roleId}")]
        public async Task<ActionResult> DeleteRole(int roleId)
        {
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null)
            {
                return NotFound(new { message = "Role not found" });
            }

            if (role.IsSystemRole)
            {
                return BadRequest(new { message = "Cannot delete system roles" });
            }

            // Check if any users have this role
            var usersWithRole = await _context.Users.AnyAsync(u => u.Role == role.Name);
            if (usersWithRole)
            {
                return BadRequest(new { message = $"Cannot delete role '{role.Name}' because it is assigned to one or more users" });
            }

            // Delete role permissions
            await _rolePermissionRepository.DeleteByRoleAsync(role.Name);

            // Delete role
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Role '{role.Name}' deleted successfully" });
        }

        // POST: api/rolepermission/seed
        [HttpPost("seed")]
        public async Task<ActionResult> SeedDefaultPermissions()
        {
            // Clear existing permissions
            var existingPermissions = await _rolePermissionRepository.GetAllAsync();
            foreach (var perm in existingPermissions)
            {
                await _rolePermissionRepository.DeleteAsync(perm);
            }

            // ADMIN gets all permissions
            var allPermissions = Permissions.GetAllPermissions();
            foreach (var permission in allPermissions)
            {
                await _rolePermissionRepository.AddAsync(new RolePermission
                {
                    Role = "ADMIN",
                    Permission = permission,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = "System"
                });
            }

            // COORDONATOR VANZARI gets most permissions except user management
            var coordonatorPermissions = allPermissions.Where(p => 
                !p.StartsWith("Users.") && 
                !p.StartsWith("Roles.") &&
                p != Permissions.ManageRolePermissions
            ).ToList();
            foreach (var permission in coordonatorPermissions)
            {
                await _rolePermissionRepository.AddAsync(new RolePermission
                {
                    Role = "COORDONATOR VANZARI",
                    Permission = permission,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = "System"
                });
            }

            // AGENT TEREN gets basic view permissions
            var agentTerenPermissions = new List<string>
            {
                Permissions.ViewAcquisitionsTab,
                Permissions.ViewAcquisition,
                Permissions.ViewInventoryTab,
                Permissions.ViewMaterial,
                Permissions.ViewProductionTab,
                Permissions.ViewProductionPlan,
                Permissions.ViewOrdersTab,
                Permissions.ViewOrder
            };
            foreach (var permission in agentTerenPermissions)
            {
                await _rolePermissionRepository.AddAsync(new RolePermission
                {
                    Role = "AGENT TEREN",
                    Permission = permission,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = "System"
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Default permissions seeded successfully" });
        }
    }
}


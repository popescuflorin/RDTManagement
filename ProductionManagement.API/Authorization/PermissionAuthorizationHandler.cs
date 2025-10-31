using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Repositories;
using System.Security.Claims;

namespace ProductionManagement.API.Authorization
{
    public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
    {
        private readonly IRolePermissionRepository _rolePermissionRepository;

        public PermissionAuthorizationHandler(IRolePermissionRepository rolePermissionRepository)
        {
            _rolePermissionRepository = rolePermissionRepository;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermissionRequirement requirement)
        {
            // Get user's role from claims
            var roleClaim = context.User.FindFirst(ClaimTypes.Role);
            if (roleClaim == null)
            {
                return;
            }

            var userRole = roleClaim.Value;

            // Admin always has all permissions
            if (userRole == "Admin")
            {
                context.Succeed(requirement);
                return;
            }

            // Check if role has the required permission
            var rolePermissions = await _rolePermissionRepository.GetPermissionsByRoleAsync(userRole);
            if (rolePermissions.Contains(requirement.Permission))
            {
                context.Succeed(requirement);
            }
        }
    }
}


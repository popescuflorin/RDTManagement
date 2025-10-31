using Microsoft.AspNetCore.Authorization;

namespace ProductionManagement.API.Authorization
{
    public class RequirePermissionAttribute : AuthorizeAttribute
    {
        public RequirePermissionAttribute(string permission)
        {
            Policy = permission;
        }
    }
}


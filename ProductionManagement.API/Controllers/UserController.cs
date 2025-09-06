using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Models;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private static readonly List<User> _users = new List<User>
        {
            new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@example.com",
                PasswordHash = "hashedpassword",
                FirstName = "Admin",
                LastName = "User",
                Role = "Admin",
                CreatedAt = DateTime.Now.AddDays(-30),
                LastLoginAt = DateTime.Now.AddDays(-1),
                IsActive = true
            },
            new User
            {
                Id = 2,
                Username = "user",
                Email = "user@example.com",
                PasswordHash = "hashedpassword",
                FirstName = "Regular",
                LastName = "User",
                Role = "User",
                CreatedAt = DateTime.Now.AddDays(-15),
                LastLoginAt = DateTime.Now.AddDays(-2),
                IsActive = true
            }
        };

        [HttpGet("profile")]
        public ActionResult<UserInfo> GetProfile()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = _users.FirstOrDefault(u => u.Id == userId && u.IsActive);
            if (user == null)
            {
                return NotFound();
            }

            var userInfo = new UserInfo
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                LastLoginAt = user.LastLoginAt
            };

            return Ok(userInfo);
        }

        [HttpPut("profile")]
        public ActionResult<UserInfo> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = _users.FirstOrDefault(u => u.Id == userId && u.IsActive);
            if (user == null)
            {
                return NotFound();
            }

            // Update user information
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = request.Email;

            var userInfo = new UserInfo
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                LastLoginAt = user.LastLoginAt
            };

            return Ok(userInfo);
        }

        [HttpGet("dashboard")]
        public ActionResult<DashboardData> GetDashboardData()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = _users.FirstOrDefault(u => u.Id == userId && u.IsActive);
            if (user == null)
            {
                return NotFound();
            }

            var dashboardData = new DashboardData
            {
                WelcomeMessage = $"Welcome back, {user.FirstName}!",
                TotalUsers = _users.Count,
                ActiveUsers = _users.Count(u => u.IsActive),
                LastLogin = user.LastLoginAt,
                SystemStatus = "All systems operational",
                RecentActivity = new List<string>
                {
                    "User logged in successfully",
                    "Dashboard data loaded",
                    "Profile information accessed"
                }
            };

            return Ok(dashboardData);
        }
    }

    public class UpdateProfileRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class DashboardData
    {
        public string WelcomeMessage { get; set; } = string.Empty;
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public DateTime LastLogin { get; set; }
        public string SystemStatus { get; set; } = string.Empty;
        public List<string> RecentActivity { get; set; } = new List<string>();
    }
}

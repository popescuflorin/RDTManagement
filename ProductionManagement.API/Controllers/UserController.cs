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

        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public ActionResult<List<UserInfo>> GetAllUsers()
        {
            var userInfos = _users.Select(u => new UserInfo
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Role = u.Role,
                LastLoginAt = u.LastLoginAt
            }).ToList();

            return Ok(userInfos);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public ActionResult<UserInfo> UpdateUser(int id, [FromBody] AdminUpdateUserRequest request)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Check if username already exists for another user
            if (_users.Any(u => u.Username == request.Username && u.Id != id))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            // Check if email already exists for another user
            if (_users.Any(u => u.Email == request.Email && u.Id != id))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            // Update user information
            user.Username = request.Username;
            user.Email = request.Email;
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Role = request.Role;
            user.IsActive = request.IsActive;

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

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public IActionResult DeleteUser(int id)
        {
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserIdClaim != null && int.TryParse(currentUserIdClaim, out var currentUserId))
            {
                if (currentUserId == id)
                {
                    return BadRequest(new { message = "You cannot delete your own account" });
                }
            }

            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            _users.Remove(user);
            return Ok(new { message = "User deleted successfully" });
        }

        public static User? GetUserById(int id)
        {
            return _users.FirstOrDefault(u => u.Id == id && u.IsActive);
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

    public class AdminUpdateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}

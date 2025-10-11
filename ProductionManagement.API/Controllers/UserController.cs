using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UserController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpGet("profile")]
        public async Task<ActionResult<UserInfo>> GetProfile()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null || !user.IsActive)
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
        public async Task<ActionResult<UserInfo>> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null || !user.IsActive)
            {
                return NotFound();
            }

            // Update user information
            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Email = request.Email;

            await _userRepository.UpdateAsync(user);

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
        public async Task<ActionResult<DashboardData>> GetDashboardData()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null || !user.IsActive)
            {
                return NotFound();
            }

            var allUsers = await _userRepository.GetAllAsync();

            var dashboardData = new DashboardData
            {
                WelcomeMessage = $"Welcome back, {user.FirstName}!",
                TotalUsers = allUsers.Count(),
                ActiveUsers = allUsers.Count(u => u.IsActive),
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
        public async Task<ActionResult<List<UserInfo>>> GetAllUsers()
        {
            var users = await _userRepository.GetActiveUsersAsync();
            var userInfos = users.Select(u => new UserInfo
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
        public async Task<ActionResult<UserInfo>> UpdateUser(int id, [FromBody] AdminUpdateUserRequest request)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Check if username already exists for another user
            var usernameExists = await _userRepository.FirstOrDefaultAsync(u => u.Username == request.Username && u.Id != id);
            if (usernameExists != null)
            {
                return BadRequest(new { message = "Username already exists" });
            }

            // Check if email already exists for another user
            var emailExists = await _userRepository.FirstOrDefaultAsync(u => u.Email == request.Email && u.Id != id);
            if (emailExists != null)
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

            await _userRepository.UpdateAsync(user);

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
        public async Task<IActionResult> DeleteUser(int id)
        {
            var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserIdClaim != null && int.TryParse(currentUserIdClaim, out var currentUserId))
            {
                if (currentUserId == id)
                {
                    return BadRequest(new { message = "You cannot delete your own account" });
                }
            }

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            await _userRepository.DeleteAsync(user);
            return Ok(new { message = "User deleted successfully" });
        }

        // Static method removed - use IUserRepository.GetByIdAsync instead
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

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Models;
using ProductionManagement.API.Services;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IJwtService _jwtService;
        private static readonly List<User> _users = new List<User>
        {
            new User
            {
                Id = 1,
                Username = "admin",
                Email = "admin@example.com",
                PasswordHash = HashPassword("admin123"),
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
                PasswordHash = HashPassword("user123"),
                FirstName = "Regular",
                LastName = "User",
                Role = "User",
                CreatedAt = DateTime.Now.AddDays(-15),
                LastLoginAt = DateTime.Now.AddDays(-2),
                IsActive = true
            }
        };

        private static readonly Dictionary<string, string> _refreshTokens = new Dictionary<string, string>();

        public AuthController(IJwtService jwtService)
        {
            _jwtService = jwtService;
        }

        [HttpPost("login")]
        public ActionResult<LoginResponse> Login(LoginRequest request)
        {
            var user = _users.FirstOrDefault(u => u.Username == request.Username && u.IsActive);
            
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }

            user.LastLoginAt = DateTime.UtcNow;

            var token = _jwtService.GenerateToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();
            
            _refreshTokens[refreshToken] = user.Username;

            var response = new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = new UserInfo
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = user.Role,
                    LastLoginAt = user.LastLoginAt
                }
            };

            return Ok(response);
        }


        [HttpPost("refresh")]
        public ActionResult<LoginResponse> RefreshToken([FromBody] string refreshToken)
        {
            if (!_refreshTokens.TryGetValue(refreshToken, out var username))
            {
                return Unauthorized(new { message = "Invalid refresh token" });
            }

            var user = _users.FirstOrDefault(u => u.Username == username && u.IsActive);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            var newToken = _jwtService.GenerateToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();
            
            _refreshTokens.Remove(refreshToken);
            _refreshTokens[newRefreshToken] = user.Username;

            var response = new LoginResponse
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = new UserInfo
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = user.Role,
                    LastLoginAt = user.LastLoginAt
                }
            };

            return Ok(response);
        }

        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout([FromBody] string refreshToken)
        {
            _refreshTokens.Remove(refreshToken);
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpGet("debug/claims")]
        [Authorize]
        public IActionResult GetClaims()
        {
            var claims = User.Claims.Select(c => new { Type = c.Type, Value = c.Value }).ToList();
            var roleClaimStandard = User.FindFirst(ClaimTypes.Role)?.Value;
            var roleClaimMicrosoft = User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value;
            var roleClaimSimple = User.FindFirst("role")?.Value;
            
            return Ok(new { 
                claims = claims, 
                roleStandard = roleClaimStandard,
                roleMicrosoft = roleClaimMicrosoft,
                roleSimple = roleClaimSimple,
                allRoleTypes = claims.Where(c => c.Type.Contains("role")).ToList()
            });
        }

        [HttpPost("admin/register")]
        [Authorize(Roles = "Admin")]
        public ActionResult<UserInfo> AdminRegister(AdminRegisterRequest request)
        {
            if (_users.Any(u => u.Username == request.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            if (_users.Any(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            var user = new User
            {
                Id = _users.Count > 0 ? _users.Max(u => u.Id) + 1 : 1,
                Username = request.Username,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = request.Role,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow,
                IsActive = true
            };

            _users.Add(user);

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

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private static bool VerifyPassword(string password, string hash)
        {
            var hashedPassword = HashPassword(password);
            return hashedPassword == hash;
        }
    }
}

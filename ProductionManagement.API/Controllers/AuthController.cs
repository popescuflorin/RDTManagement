using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;
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
        private readonly IEmailService _emailService;
        private readonly IUserRepository _userRepository;
        private readonly IRolePermissionRepository _rolePermissionRepository;
        private static readonly Dictionary<string, string> _refreshTokens = new Dictionary<string, string>();

        public AuthController(IJwtService jwtService, IUserRepository userRepository, IRolePermissionRepository rolePermissionRepository, IEmailService emailService)
        {
            _jwtService = jwtService;
            _userRepository = userRepository;
            _rolePermissionRepository = rolePermissionRepository;
            _emailService = emailService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
        {
            var user = await _userRepository.GetByUsernameAsync(request.Username);
            
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }

            // Check if user account is active
            if (!user.IsActive)
            {
                return Unauthorized(new { message = "Your account has been deactivated. Please contact an administrator." });
            }

            user.LastLoginAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            var token = _jwtService.GenerateToken(user);
            var refreshToken = _jwtService.GenerateRefreshToken();
            
            _refreshTokens[refreshToken] = user.Username;

            var userInfo = await CreateUserInfoAsync(user);

            var response = new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = userInfo
            };

            return Ok(response);
        }


        [HttpPost("refresh")]
        public async Task<ActionResult<LoginResponse>> RefreshToken([FromBody] string refreshToken)
        {
            if (!_refreshTokens.TryGetValue(refreshToken, out var username))
            {
                return Unauthorized(new { message = "Invalid refresh token" });
            }

            var user = await _userRepository.GetByUsernameAsync(username);
            if (user == null)
            {
                return Unauthorized(new { message = "User not found" });
            }

            // Check if user account is active
            if (!user.IsActive)
            {
                _refreshTokens.Remove(refreshToken);
                return Unauthorized(new { message = "Your account has been deactivated. Please contact an administrator." });
            }

            var newToken = _jwtService.GenerateToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();
            
            _refreshTokens.Remove(refreshToken);
            _refreshTokens[newRefreshToken] = user.Username;

            var userInfo = await CreateUserInfoAsync(user);

            var response = new LoginResponse
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                User = userInfo
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
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<UserInfo>> AdminRegister(AdminRegisterRequest request)
        {
            if (await _userRepository.UsernameExistsAsync(request.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            if (await _userRepository.EmailExistsAsync(request.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Role = request.Role,
                CreatedAt = DateTime.UtcNow,
                LastLoginAt = DateTime.UtcNow,
                IsActive = true,
                ReceiveEmails = request.ReceiveEmails
            };

            var createdUser = await _userRepository.AddAsync(user);
            var userInfo = await CreateUserInfoAsync(createdUser);
            
            // Only send welcome email if user has email notifications enabled
            if (request.ReceiveEmails)
            {
                await _emailService.SendWelcomeEmailAsync(request.Email, request.Username, request.Password);
            }
            
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

        private async Task<UserInfo> CreateUserInfoAsync(User user)
        {
            var permissions = await _rolePermissionRepository.GetPermissionsByRoleAsync(user.Role);
            
            return new UserInfo
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role,
                LastLoginAt = user.LastLoginAt,
                IsActive = user.IsActive,
                ReceiveEmails = user.ReceiveEmails,
                Permissions = permissions.ToList()
            };
        }
    }
}

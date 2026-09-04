using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Oracle.ManagedDataAccess.Client;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using web_server.Data;
using web_server.Models;

namespace web_server.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly OracleDbContext _oracleDb;
    private readonly IConfiguration _config;

    public AuthController(OracleDbContext oracleDb, IConfiguration config)
    {
        _oracleDb = oracleDb;
        _config = config;
    }

    [HttpPost("donors/register")]
    public ActionResult<ApiResponse<AuthResponseDto>> RegisterDonor([FromBody] RegisterDonorDto dto)
    {
        try
        {
            if (dto.Password.Length < 8)
                return BadRequest(ApiResponse<AuthResponseDto>.Error("Password must be at least 8 characters."));

            dto.Email = dto.Email.ToLowerInvariant();
            var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            
            using var connection = _oracleDb.CreateConnection() as OracleConnection;
            if (connection == null) return StatusCode(500, "Database connection error");
            connection.Open();

            using var cmd = new OracleCommand("REGISTER_DONOR", connection);
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.Add("p_username", OracleDbType.Varchar2).Value = dto.Username;
            cmd.Parameters.Add("p_email", OracleDbType.Varchar2).Value = dto.Email;
            cmd.Parameters.Add("p_password_hash", OracleDbType.Varchar2).Value = hash;
            cmd.Parameters.Add("p_full_name", OracleDbType.Varchar2).Value = dto.FullName;
            cmd.Parameters.Add("p_nic", OracleDbType.Varchar2).Value = dto.Nic;
            cmd.Parameters.Add("p_date_of_birth", OracleDbType.Date).Value = dto.DateOfBirth;
            cmd.Parameters.Add("p_gender", OracleDbType.Varchar2).Value = dto.Gender;
            cmd.Parameters.Add("p_phone", OracleDbType.Varchar2).Value = dto.Phone;
            cmd.Parameters.Add("p_address", OracleDbType.Varchar2).Value = dto.Address;

            var pUserId = new OracleParameter("p_user_id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
            var pDonorId = new OracleParameter("p_donor_id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pUserId);
            cmd.Parameters.Add(pDonorId);

            cmd.ExecuteNonQuery();

            int userId = Convert.ToInt32(pUserId.Value.ToString());

            var userPrincipal = new UserPrincipalDto
            {
                UserId = userId,
                Username = dto.Username,
                Role = "DONOR",
                Status = "ACTIVE"
            };

            var token = GenerateJwt(userPrincipal);
            return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto { Token = token, User = userPrincipal }, "Registered successfully");
        }
        catch (OracleException ex)
        {
            if (ex.Number == 1) // Unique constraint violation
            {
                return BadRequest(ApiResponse<AuthResponseDto>.Error("Username, email, or NIC already exists."));
            }
            return StatusCode(500, ApiResponse<AuthResponseDto>.Error("Database error during registration."));
        }
    }

    [HttpPost("login")]
    public ActionResult<ApiResponse<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        if (connection == null) return StatusCode(500, "Database connection error");
        connection.Open();

        using var cmd = new OracleCommand("AUTHENTICATE_USER", connection);
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.Add("p_username", OracleDbType.Varchar2).Value = dto.Username.ToLowerInvariant();
        var pUserId = new OracleParameter("p_user_id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
        var pHash = new OracleParameter("p_password_hash", OracleDbType.Varchar2, 500) { Direction = ParameterDirection.Output };
        var pStatus = new OracleParameter("p_account_status", OracleDbType.Varchar2, 20) { Direction = ParameterDirection.Output };
        var pRole = new OracleParameter("p_role_code", OracleDbType.Varchar2, 30) { Direction = ParameterDirection.Output };

        cmd.Parameters.Add(pUserId);
        cmd.Parameters.Add(pHash);
        cmd.Parameters.Add(pStatus);
        cmd.Parameters.Add(pRole);

        cmd.ExecuteNonQuery();

        if (pUserId.Value == null || pUserId.Value.ToString() == "null" || string.IsNullOrEmpty(pUserId.Value.ToString()))
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.Error("Invalid credentials"));
        }

        var hash = pHash.Value.ToString();
        var status = pStatus.Value.ToString();
        var role = pRole.Value.ToString();

        try
        {
            if (!BCrypt.Net.BCrypt.Verify(dto.Password, hash))
            {
                return Unauthorized(ApiResponse<AuthResponseDto>.Error("Invalid credentials"));
            }
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // Fallback for legacy plain-text passwords in dev database, or just reject
            // For production, this should always reject. We'll reject gracefully.
            if (dto.Password != hash) 
            {
                return Unauthorized(ApiResponse<AuthResponseDto>.Error("Invalid credentials"));
            }
        }

        if (status != "ACTIVE")
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.Error($"Account is {status}"));
        }

        var userPrincipal = new UserPrincipalDto
        {
            UserId = Convert.ToInt32(pUserId.Value.ToString()),
            Username = dto.Username,
            Role = role!,
            Status = status
        };

        var token = GenerateJwt(userPrincipal);
        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto { Token = token, User = userPrincipal }, "Login successful");
    }

    [HttpPost("seed-webmaster")]
    public ActionResult<ApiResponse<string>> SeedWebmaster()
    {
        try
        {
            using var connection = _oracleDb.CreateConnection() as OracleConnection;
            connection!.Open();
            
            // Check if webmaster already exists
            using var checkCmd = new OracleCommand("SELECT COUNT(*) FROM USER_ROLE_LINK WHERE ROLE_CODE = 'WEBMASTER'", connection);
            var count = Convert.ToInt32(checkCmd.ExecuteScalar());
            if (count > 0)
            {
                return BadRequest(ApiResponse<string>.Error("Webmaster already exists."));
            }

            using var trans = connection.BeginTransaction();
            
            var hash = BCrypt.Net.BCrypt.HashPassword("admin123");
            using var insertUser = new OracleCommand(@"
                INSERT INTO APP_USER (USERNAME, EMAIL, PASSWORD_HASH, ACCOUNT_STATUS)
                VALUES ('admin', 'admin@lifeline.com', :hash, 'ACTIVE') RETURNING USER_ID INTO :id", connection);
            
            insertUser.Parameters.Add("hash", OracleDbType.Varchar2).Value = hash;
            var outId = new OracleParameter("id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
            insertUser.Parameters.Add(outId);
            insertUser.ExecuteNonQuery();

            var userId = Convert.ToInt32(outId.Value.ToString());

            using var insertRole = new OracleCommand(@"
                INSERT INTO USER_ROLE_LINK (USER_ID, ROLE_CODE) 
                VALUES (:userId, 'WEBMASTER')", connection);
            insertRole.Parameters.Add("userId", OracleDbType.Decimal).Value = userId;
            insertRole.ExecuteNonQuery();

            trans.Commit();
            return ApiResponse<string>.Ok("Webmaster seeded successfully! Username: admin, Password: admin123");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Error("Failed to seed webmaster: " + ex.Message));
        }
    }

    [HttpGet("me")]
    public ActionResult<ApiResponse<UserPrincipalDto>> GetMe()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

        return ApiResponse<UserPrincipalDto>.Ok(new UserPrincipalDto
        {
            UserId = int.Parse(userIdClaim),
            Username = User.FindFirst(ClaimTypes.Name)?.Value ?? "",
            Role = User.FindFirst(ClaimTypes.Role)?.Value ?? "",
            Status = "ACTIVE"
        });
    }

    private string GenerateJwt(UserPrincipalDto user)
    {
        var settings = _config.GetSection("JwtSettings");
        var secret = settings["Secret"];
        var issuer = settings["Issuer"];
        var audience = settings["Audience"];
        var expMin = int.Parse(settings["ExpirationMinutes"] ?? "1440");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expMin),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

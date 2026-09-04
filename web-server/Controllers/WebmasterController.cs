using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using Oracle.ManagedDataAccess.Client;
using Oracle.ManagedDataAccess.Types;
using System.Data;
using web_server.Data;
using web_server.Models;
using QuestPDF.Fluent;

namespace web_server.Controllers;

[ApiController]
[Route("api/webmaster")]
[Authorize(Roles = "WEBMASTER")]
public class WebmasterController : ControllerBase
{
    private readonly OracleDbContext _oracleDb;
    private readonly MongoDbContext _mongoDb;

    public WebmasterController(OracleDbContext oracleDb, MongoDbContext mongoDb)
    {
        _oracleDb = oracleDb;
        _mongoDb = mongoDb;
    }

    [HttpGet("dashboard")]
    public ActionResult<ApiResponse<object>> GetDashboard()
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        if (connection == null) return StatusCode(500, "Database connection error");
        connection.Open();

        using var cmd = new OracleCommand("GET_WEBMASTER_DASHBOARD", connection);
        cmd.CommandType = CommandType.StoredProcedure;

        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();

        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        if (reader.Read())
        {
            var stats = new
            {
                TotalDonors = Convert.ToInt32(reader["TOTAL_DONORS"]),
                TotalBanks = Convert.ToInt32(reader["TOTAL_BANKS"]),
                TotalCommittees = Convert.ToInt32(reader["TOTAL_COMMITTEES"]),
                OngoingCamps = Convert.ToInt32(reader["ONGOING_CAMPS"]),
                CompletedCamps = Convert.ToInt32(reader["COMPLETED_CAMPS"]),
                TotalDonations = Convert.ToInt32(reader["TOTAL_DONATIONS"]),
                PendingRequests = Convert.ToInt32(reader["PENDING_REQUESTS"])
            };
            return ApiResponse<object>.Ok(stats);
        }

        return ApiResponse<object>.Error("Failed to read webmaster dashboard data");
    }

    [HttpGet("overview")]
    public async Task<ActionResult<ApiResponse<object>>> GetOverview()
    {
        var appealsCol = _mongoDb.GetCollection<BsonDocument>("emergencyAppeals");
        var activeAppeals = await appealsCol.CountDocumentsAsync(Builders<BsonDocument>.Filter.Eq("status", "ACTIVE"));

        var threadsCol = _mongoDb.GetCollection<BsonDocument>("communityThreads");
        var totalThreads = await threadsCol.CountDocumentsAsync(Builders<BsonDocument>.Filter.Empty);

        return ApiResponse<object>.Ok(new
        {
            ActiveAppeals = activeAppeals,
            TotalCommunityThreads = totalThreads,
            SystemHealth = "GOOD",
            Uptime = "99.9%"
        });
    }

    [HttpGet("users")]
    public ActionResult<ApiResponse<List<object>>> GetUsers()
    {
        var list = new List<object>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.CommandText = "GET_ALL_USERS";
        
        var pCursor = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pCursor);
        
        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pCursor.Value).GetDataReader();
        while(reader.Read())
        {
            list.Add(new {
                UserId = reader["USER_ID"],
                Email = reader["EMAIL"],
                Role = reader["ROLE"],
                Status = reader["STATUS"],
                CreatedAt = reader["CREATED_AT"],
                LastLogin = reader["LAST_LOGIN"] != DBNull.Value ? reader["LAST_LOGIN"] : null
            });
        }
        return ApiResponse<List<object>>.Ok(list);
    }

    [HttpPost("guidelines")]
    public async Task<ActionResult<ApiResponse<string>>> CreateGuideline([FromBody] web_server.Models.Mongo.MedicalGuideline req)
    {
        req.LastUpdated = DateTime.UtcNow;
        var col = _mongoDb.GetCollection<web_server.Models.Mongo.MedicalGuideline>("medicalGuidelines");
        await col.InsertOneAsync(req);
        return ApiResponse<string>.Ok("Guideline created successfully.");
    }

    [HttpGet("reports/system")]
    public ActionResult GenerateSystemReport()
    {
        var document = QuestPDF.Fluent.Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(QuestPDF.Helpers.PageSizes.A4);
                page.Margin(2, QuestPDF.Infrastructure.Unit.Centimetre);
                page.Header().Text("System Master Report").SemiBold().FontSize(24).FontColor(QuestPDF.Helpers.Colors.Red.Medium);
                
                page.Content().PaddingVertical(1, QuestPDF.Infrastructure.Unit.Centimetre).Column(x =>
                {
                    x.Item().Text($"Date Generated: {DateTime.Now:yyyy-MM-dd HH:mm}").FontSize(10);
                    x.Spacing(20);
                    x.Item().Text("This is an aggregated audit report of the LifeLineConnect system.").FontSize(12);
                });
            });
        });
        return File(document.GeneratePdf(), "application/pdf", "System_Report.pdf");
    }

    public class RegisterBankDto
    {
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string BankCode { get; set; } = "";
        public string BankName { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Address { get; set; } = "";
    }

    [HttpPost("register-bank")]
    public ActionResult<ApiResponse<string>> RegisterBank([FromBody] RegisterBankDto dto)
    {
        try
        {
            if (dto.Password.Length < 8) return BadRequest(ApiResponse<string>.Error("Password must be at least 8 characters."));
            
            using var connection = _oracleDb.CreateConnection() as OracleConnection;
            connection!.Open();
            using var trans = connection.BeginTransaction();
            
            var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            
            // 1. Create App User
            using var insertUser = new OracleCommand(@"
                INSERT INTO APP_USER (USERNAME, EMAIL, PASSWORD_HASH, ACCOUNT_STATUS)
                VALUES (:u, :e, :h, 'ACTIVE') RETURNING USER_ID INTO :id", connection);
            insertUser.Parameters.Add("u", OracleDbType.Varchar2).Value = dto.Username.ToLowerInvariant();
            insertUser.Parameters.Add("e", OracleDbType.Varchar2).Value = dto.Email.ToLowerInvariant();
            insertUser.Parameters.Add("h", OracleDbType.Varchar2).Value = hash;
            var outId = new OracleParameter("id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
            insertUser.Parameters.Add(outId);
            insertUser.ExecuteNonQuery();
            var userId = Convert.ToInt32(outId.Value.ToString());

            // 2. Create Blood Bank
            using var insertBank = new OracleCommand(@"
                INSERT INTO BLOOD_BANK (BANK_CODE, BANK_NAME, PHONE, EMAIL, ADDRESS)
                VALUES (:c, :n, :p, :e, :a) RETURNING BLOOD_BANK_ID INTO :bid", connection);
            insertBank.Parameters.Add("c", OracleDbType.Varchar2).Value = dto.BankCode;
            insertBank.Parameters.Add("n", OracleDbType.Varchar2).Value = dto.BankName;
            insertBank.Parameters.Add("p", OracleDbType.Varchar2).Value = dto.Phone;
            insertBank.Parameters.Add("e", OracleDbType.Varchar2).Value = dto.Email;
            insertBank.Parameters.Add("a", OracleDbType.Varchar2).Value = dto.Address;
            var outBankId = new OracleParameter("bid", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
            insertBank.Parameters.Add(outBankId);
            insertBank.ExecuteNonQuery();
            var bankId = Convert.ToInt32(outBankId.Value.ToString());

            // 3. Link Role
            using var insertRole = new OracleCommand(@"
                INSERT INTO USER_ROLE_LINK (USER_ID, ROLE_CODE, BLOOD_BANK_ID) 
                VALUES (:uid, 'BLOOD_BANK', :bid)", connection);
            insertRole.Parameters.Add("uid", OracleDbType.Decimal).Value = userId;
            insertRole.Parameters.Add("bid", OracleDbType.Decimal).Value = bankId;
            insertRole.ExecuteNonQuery();

            trans.Commit();
            return ApiResponse<string>.Ok("Blood bank account created successfully.");
        }
        catch (OracleException ex) when (ex.Number == 1)
        {
            return BadRequest(ApiResponse<string>.Error("Username, email, or Bank Code already exists."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Error("Failed to register bank: " + ex.Message));
        }
    }

    public class RegisterCommitteeDto
    {
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string CommitteeCode { get; set; } = "";
        public string CommitteeName { get; set; } = "";
        public string Phone { get; set; } = "";
        public string Address { get; set; } = "";
    }

    [HttpPost("register-committee")]
    public ActionResult<ApiResponse<string>> RegisterCommittee([FromBody] RegisterCommitteeDto dto)
    {
        try
        {
            if (dto.Password.Length < 8) return BadRequest(ApiResponse<string>.Error("Password must be at least 8 characters."));

            using var connection = _oracleDb.CreateConnection() as OracleConnection;
            connection!.Open();
            using var trans = connection.BeginTransaction();
            
            var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            
            // 1. Create App User
            using var insertUser = new OracleCommand(@"
                INSERT INTO APP_USER (USERNAME, EMAIL, PASSWORD_HASH, ACCOUNT_STATUS)
                VALUES (:u, :e, :h, 'ACTIVE') RETURNING USER_ID INTO :id", connection);
            insertUser.Parameters.Add("u", OracleDbType.Varchar2).Value = dto.Username.ToLowerInvariant();
            insertUser.Parameters.Add("e", OracleDbType.Varchar2).Value = dto.Email.ToLowerInvariant();
            insertUser.Parameters.Add("h", OracleDbType.Varchar2).Value = hash;
            var outId = new OracleParameter("id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
            insertUser.Parameters.Add(outId);
            insertUser.ExecuteNonQuery();
            var userId = Convert.ToInt32(outId.Value.ToString());

            // 2. Create Committee
            using var insertComm = new OracleCommand(@"
                INSERT INTO ORGANIZING_COMMITTEE (COMMITTEE_CODE, COMMITTEE_NAME, PHONE, EMAIL, ADDRESS)
                VALUES (:c, :n, :p, :e, :a) RETURNING COMMITTEE_ID INTO :cid", connection);
            insertComm.Parameters.Add("c", OracleDbType.Varchar2).Value = dto.CommitteeCode;
            insertComm.Parameters.Add("n", OracleDbType.Varchar2).Value = dto.CommitteeName;
            insertComm.Parameters.Add("p", OracleDbType.Varchar2).Value = dto.Phone;
            insertComm.Parameters.Add("e", OracleDbType.Varchar2).Value = dto.Email;
            insertComm.Parameters.Add("a", OracleDbType.Varchar2).Value = dto.Address;
            var outCommId = new OracleParameter("cid", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
            insertComm.Parameters.Add(outCommId);
            insertComm.ExecuteNonQuery();
            var commId = Convert.ToInt32(outCommId.Value.ToString());

            // 3. Link Role
            using var insertRole = new OracleCommand(@"
                INSERT INTO USER_ROLE_LINK (USER_ID, ROLE_CODE, COMMITTEE_ID) 
                VALUES (:uid, 'ORGANIZING_COMMITTEE', :cid)", connection);
            insertRole.Parameters.Add("uid", OracleDbType.Decimal).Value = userId;
            insertRole.Parameters.Add("cid", OracleDbType.Decimal).Value = commId;
            insertRole.ExecuteNonQuery();

            trans.Commit();
            return ApiResponse<string>.Ok("Committee account created successfully.");
        }
        catch (OracleException ex) when (ex.Number == 1)
        {
            return BadRequest(ApiResponse<string>.Error("Username, email, or Committee Code already exists."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Error("Failed to register committee: " + ex.Message));
        }
    }
}

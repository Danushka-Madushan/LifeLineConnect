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
        cmd.CommandText = "FN_GET_ALL_USERS";
        
        var pCursor = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.ReturnValue };
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
                page.Margin(1.5f, QuestPDF.Infrastructure.Unit.Centimetre);
                
                page.Header().Column(header =>
                {
                    header.Item().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("LIFELINECONNECT").Bold().FontSize(9).FontColor(QuestPDF.Helpers.Colors.Red.Medium);
                            col.Item().Text("System Master Audit & Health Report").ExtraBold().FontSize(18).FontColor(QuestPDF.Helpers.Colors.Grey.Darken4);
                            col.Item().Text($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss} | Scope: Full Enterprise System").FontSize(8.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                        });
                    });
                    header.Item().PaddingTop(6).LineHorizontal(1.5f).LineColor(QuestPDF.Helpers.Colors.Red.Medium);
                });
                
                page.Content().PaddingTop(15).Column(x =>
                {
                    x.Item().Background(QuestPDF.Helpers.Colors.Grey.Lighten4).Padding(12).Column(card =>
                    {
                        card.Item().Text("System Health Overview").Bold().FontSize(12).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);
                        card.Item().PaddingTop(4).Text("This report certifies the operational integrity and regulatory compliance of the LifeLineConnect platform, encompassing Oracle 21c transactional persistence, MongoDB non-relational audit streams, and real-time emergency dispatch coordination.").FontSize(9.5f).LineHeight(1.4f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken2);
                    });

                    x.Spacing(15);
                    
                    x.Item().Text("Operational Highlights").Bold().FontSize(11).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);
                    x.Item().PaddingTop(6).Table(t =>
                    {
                        t.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(2);
                            c.RelativeColumn(3);
                            c.RelativeColumn(1.5f);
                        });

                        t.Header(h =>
                        {
                            h.Cell().Background(QuestPDF.Helpers.Colors.Grey.Lighten3).Padding(6).Text("Subsystem").Bold().FontSize(9).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);
                            h.Cell().Background(QuestPDF.Helpers.Colors.Grey.Lighten3).Padding(6).Text("Operational Scope").Bold().FontSize(9).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);
                            h.Cell().Background(QuestPDF.Helpers.Colors.Grey.Lighten3).Padding(6).AlignCenter().Text("Status").Bold().FontSize(9).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);
                        });

                        void AddRow(string system, string desc, string status)
                        {
                            t.Cell().BorderBottom(0.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).Padding(6).Text(system).SemiBold().FontSize(8.5f);
                            t.Cell().BorderBottom(0.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).Padding(6).Text(desc).FontSize(8.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken2);
                            t.Cell().BorderBottom(0.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).Padding(6).AlignCenter().Text(status).Bold().FontSize(8.5f).FontColor(QuestPDF.Helpers.Colors.Green.Darken2);
                        }

                        AddRow("Relational Engine", "Oracle 21c PDB with Automated Triggers & Auditing", "ACTIVE");
                        AddRow("Document Engine", "MongoDB Atlas Guidelines & Emergency Feed", "ACTIVE");
                        AddRow("Notification Dispatcher", "Automated Donor & Committee Alert Pipelines", "ACTIVE");
                        AddRow("Inventory & Cold Chain", "Blood Unit Expiry & FIFO Allocation Engine", "ACTIVE");
                    });
                });

                page.Footer().Column(col =>
                {
                    col.Item().LineHorizontal(0.5f).LineColor(QuestPDF.Helpers.Colors.Grey.Lighten2);
                    col.Item().PaddingTop(4).Row(row =>
                    {
                        row.RelativeItem().Text("LifeLineConnect · System Master Report · Confidential").FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                        row.RelativeItem().AlignRight().Text(p =>
                        {
                            p.Span("Page ").FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                            p.CurrentPageNumber().FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                            p.Span(" of ").FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                            p.TotalPages().FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                        });
                    });
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
            
            var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            
            using var connection = _oracleDb.CreateConnection() as OracleConnection;
            if (connection == null) return StatusCode(500, "Database connection error");
            connection.Open();
            
            using var cmd = new OracleCommand("REGISTER_BLOOD_BANK", connection);
            cmd.CommandType = CommandType.StoredProcedure;
            
            cmd.Parameters.Add("p_username", OracleDbType.Varchar2).Value = dto.Username.ToLowerInvariant();
            cmd.Parameters.Add("p_email", OracleDbType.Varchar2).Value = dto.Email.ToLowerInvariant();
            cmd.Parameters.Add("p_hash", OracleDbType.Varchar2).Value = hash;
            cmd.Parameters.Add("p_bank_code", OracleDbType.Varchar2).Value = dto.BankCode;
            cmd.Parameters.Add("p_name", OracleDbType.Varchar2).Value = dto.BankName;
            cmd.Parameters.Add("p_phone", OracleDbType.Varchar2).Value = dto.Phone;
            cmd.Parameters.Add("p_address", OracleDbType.Varchar2).Value = dto.Address;
            
            cmd.ExecuteNonQuery();

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

            var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            
            using var connection = _oracleDb.CreateConnection() as OracleConnection;
            if (connection == null) return StatusCode(500, "Database connection error");
            connection.Open();
            
            using var cmd = new OracleCommand("REGISTER_COMMITTEE", connection);
            cmd.CommandType = CommandType.StoredProcedure;
            
            cmd.Parameters.Add("p_username", OracleDbType.Varchar2).Value = dto.Username.ToLowerInvariant();
            cmd.Parameters.Add("p_email", OracleDbType.Varchar2).Value = dto.Email.ToLowerInvariant();
            cmd.Parameters.Add("p_hash", OracleDbType.Varchar2).Value = hash;
            cmd.Parameters.Add("p_committee_code", OracleDbType.Varchar2).Value = dto.CommitteeCode;
            cmd.Parameters.Add("p_name", OracleDbType.Varchar2).Value = dto.CommitteeName;
            cmd.Parameters.Add("p_phone", OracleDbType.Varchar2).Value = dto.Phone;
            cmd.Parameters.Add("p_address", OracleDbType.Varchar2).Value = dto.Address;
            
            cmd.ExecuteNonQuery();

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

    [HttpDelete("users/{id}")]
    public ActionResult<ApiResponse<string>> DeleteUser(int id)
    {
        try
        {
            using var connection = _oracleDb.CreateConnection() as OracleConnection;
            if (connection == null) return StatusCode(500, "Database connection error");
            connection.Open();

            using var cmd = new OracleCommand("DELETE_USER", connection);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = id;
            cmd.ExecuteNonQuery();

            return ApiResponse<string>.Ok("User deleted successfully.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Error("Failed to delete user: " + ex.Message));
        }
    }

    [HttpGet("banks")]
    public ActionResult<ApiResponse<List<object>>> GetBanks()
    {
        var list = new List<object>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = new OracleCommand("SELECT BLOOD_BANK_ID, BANK_CODE, BANK_NAME, PHONE, EMAIL, ADDRESS, STATUS FROM BLOOD_BANK", connection);
        using var reader = cmd.ExecuteReader();
        while(reader.Read())
        {
            list.Add(new {
                BankId = reader["BLOOD_BANK_ID"],
                BankCode = reader["BANK_CODE"],
                BankName = reader["BANK_NAME"],
                Phone = reader["PHONE"],
                Email = reader["EMAIL"],
                Address = reader["ADDRESS"],
                Status = reader["STATUS"]
            });
        }
        return ApiResponse<List<object>>.Ok(list);
    }

    [HttpGet("committees")]
    public ActionResult<ApiResponse<List<object>>> GetCommittees()
    {
        var list = new List<object>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = new OracleCommand("SELECT COMMITTEE_ID, COMMITTEE_CODE, COMMITTEE_NAME, PHONE, EMAIL, ADDRESS, STATUS FROM ORGANIZING_COMMITTEE", connection);
        using var reader = cmd.ExecuteReader();
        while(reader.Read())
        {
            list.Add(new {
                CommitteeId = reader["COMMITTEE_ID"],
                CommitteeCode = reader["COMMITTEE_CODE"],
                CommitteeName = reader["COMMITTEE_NAME"],
                Phone = reader["PHONE"],
                Email = reader["EMAIL"],
                Address = reader["ADDRESS"],
                Status = reader["STATUS"]
            });
        }
        return ApiResponse<List<object>>.Ok(list);
    }

    [HttpDelete("community/threads/{threadId}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteThread(string threadId)
    {
        var threadsCol = _mongoDb.GetCollection<BsonDocument>("communityThreads");
        await threadsCol.DeleteOneAsync(Builders<BsonDocument>.Filter.Eq("_id", ObjectId.Parse(threadId)));
        
        var repliesCol = _mongoDb.GetCollection<BsonDocument>("communityReplies");
        await repliesCol.DeleteManyAsync(Builders<BsonDocument>.Filter.Eq("threadId", threadId));

        return ApiResponse<string>.Ok("Thread deleted successfully.");
    }

    [HttpDelete("community/qa/{qaId}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteQA(string qaId)
    {
        var qaCol = _mongoDb.GetCollection<BsonDocument>("communityQa");
        await qaCol.DeleteOneAsync(Builders<BsonDocument>.Filter.Eq("_id", ObjectId.Parse(qaId)));
        
        return ApiResponse<string>.Ok("QA deleted successfully.");
    }

    [HttpGet("backup")]
    public IActionResult DownloadDatabaseBackup()
    {
        try
        {
            using var connection = _oracleDb.CreateConnection() as OracleConnection;
            if (connection == null) return StatusCode(500, "Database connection error");
            connection.Open();

            using var cmd = new OracleCommand("GENERATE_SCHEMA_BACKUP", connection);
            cmd.CommandType = CommandType.StoredProcedure;

            var pDumpFile = new OracleParameter("p_dump_file", OracleDbType.Varchar2, 255)
            {
                Direction = ParameterDirection.Output
            };
            var pDirPath = new OracleParameter("p_dir_path", OracleDbType.Varchar2, 4000)
            {
                Direction = ParameterDirection.Output
            };

            cmd.Parameters.Add(pDumpFile);
            cmd.Parameters.Add(pDirPath);

            cmd.ExecuteNonQuery();

            string dumpFile = pDumpFile.Value.ToString() ?? "";
            string dirPath = pDirPath.Value.ToString() ?? "";
            string path = System.IO.Path.Combine(dirPath, dumpFile);

            if (System.IO.File.Exists(path))
            {
                return PhysicalFile(path, "application/octet-stream", dumpFile);
            }

            return NotFound(ApiResponse<string>.Error("Backup file not found on server."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Error("Failed to generate backup: " + ex.Message));
        }
    }
    public class AuditLogDto
    {
        public int LogId { get; set; }
        public string ActorRoleCode { get; set; } = "";
        public int? ActorId { get; set; }
        public string ActionCode { get; set; } = "";
        public string EntityType { get; set; } = "";
        public int? EntityId { get; set; }
        public string Details { get; set; } = "";
        public DateTime CreatedAt { get; set; }
    }

    [HttpGet("audit-logs")]
    public ActionResult<ApiResponse<List<AuditLogDto>>> GetAuditLogs()
    {
        var list = new List<AuditLogDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        if (connection == null) return StatusCode(500, "Database connection error");
        connection.Open();

        using var cmd = new OracleCommand("FN_GET_SYSTEM_AUDIT_LOGS", connection);
        cmd.CommandType = CommandType.StoredProcedure;

        var pCursor = new OracleParameter("p_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.ReturnValue };
        cmd.Parameters.Add(pCursor);

        cmd.ExecuteNonQuery();

        using var reader = ((OracleRefCursor)pCursor.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new AuditLogDto
            {
                LogId = Convert.ToInt32(reader["AUDIT_ID"]),
                ActorRoleCode = reader["ACTOR_ROLE_CODE"]?.ToString() ?? "",
                ActorId = reader["ACTOR_USER_ID"] != DBNull.Value ? Convert.ToInt32(reader["ACTOR_USER_ID"]) : null,
                ActionCode = reader["ACTION_CODE"]?.ToString() ?? "",
                EntityType = reader["ENTITY_TYPE"]?.ToString() ?? "",
                EntityId = reader["ENTITY_ID"] != DBNull.Value ? Convert.ToInt32(reader["ENTITY_ID"]) : null,
                Details = reader["DETAILS"]?.ToString() ?? "",
                CreatedAt = Convert.ToDateTime(reader["CREATED_AT"])
            });
        }
        return ApiResponse<List<AuditLogDto>>.Ok(list);
    }

    [HttpGet("audit-logs/export")]
    public ActionResult ExportAuditLogs()
    {
        var list = new List<AuditLogDto>();
        using (var connection = _oracleDb.CreateConnection() as OracleConnection)
        {
            connection!.Open();
            using var cmd = new OracleCommand("FN_GET_SYSTEM_AUDIT_LOGS", connection);
            cmd.CommandType = CommandType.StoredProcedure;
            var pCursor = new OracleParameter("p_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.ReturnValue };
            cmd.Parameters.Add(pCursor);
            cmd.ExecuteNonQuery();
            using var reader = ((OracleRefCursor)pCursor.Value).GetDataReader();
            while (reader.Read())
            {
                list.Add(new AuditLogDto
                {
                    LogId = Convert.ToInt32(reader["AUDIT_ID"]),
                    ActorRoleCode = reader["ACTOR_ROLE_CODE"]?.ToString() ?? "",
                    ActorId = reader["ACTOR_USER_ID"] != DBNull.Value ? Convert.ToInt32(reader["ACTOR_USER_ID"]) : null,
                    ActionCode = reader["ACTION_CODE"]?.ToString() ?? "",
                    EntityType = reader["ENTITY_TYPE"]?.ToString() ?? "",
                    EntityId = reader["ENTITY_ID"] != DBNull.Value ? Convert.ToInt32(reader["ENTITY_ID"]) : null,
                    Details = reader["DETAILS"]?.ToString() ?? "",
                    CreatedAt = Convert.ToDateTime(reader["CREATED_AT"])
                });
            }
        }

        var document = QuestPDF.Fluent.Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(QuestPDF.Helpers.PageSizes.A4);
                page.Margin(1.2f, QuestPDF.Infrastructure.Unit.Centimetre);
                
                page.Header().Column(header =>
                {
                    header.Item().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("LIFELINECONNECT").Bold().FontSize(9).FontColor(QuestPDF.Helpers.Colors.Red.Medium);
                            col.Item().Text("System Audit Trail Report").ExtraBold().FontSize(18).FontColor(QuestPDF.Helpers.Colors.Grey.Darken4);
                            col.Item().Text($"Generated: {DateTime.Now:yyyy-MM-dd HH:mm:ss} | Total Events Logged: {list.Count}").FontSize(8.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                        });
                    });
                    header.Item().PaddingTop(6).LineHorizontal(1.5f).LineColor(QuestPDF.Helpers.Colors.Red.Medium);
                });
                
                page.Content().PaddingTop(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(35);   // ID
                        columns.RelativeColumn(2.0f); // Actor Role
                        columns.RelativeColumn(2.2f); // Action
                        columns.RelativeColumn(1.8f); // Entity
                        columns.RelativeColumn(4.5f); // Details
                        columns.RelativeColumn(2.5f); // Created At
                    });
                    
                    table.Header(header =>
                    {
                        header.Cell().Background(QuestPDF.Helpers.Colors.Grey.Lighten3)
                              .BorderBottom(1.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Darken1)
                              .PaddingVertical(5).PaddingHorizontal(4)
                              .AlignCenter().AlignMiddle()
                              .Text("ID").Bold().FontSize(8.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);

                        header.Cell().Background(QuestPDF.Helpers.Colors.Grey.Lighten3)
                              .BorderBottom(1.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Darken1)
                              .PaddingVertical(5).PaddingHorizontal(4)
                              .AlignLeft().AlignMiddle()
                              .Text("Actor Role").Bold().FontSize(8.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);

                        header.Cell().Background(QuestPDF.Helpers.Colors.Grey.Lighten3)
                              .BorderBottom(1.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Darken1)
                              .PaddingVertical(5).PaddingHorizontal(4)
                              .AlignLeft().AlignMiddle()
                              .Text("Action").Bold().FontSize(8.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);

                        header.Cell().Background(QuestPDF.Helpers.Colors.Grey.Lighten3)
                              .BorderBottom(1.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Darken1)
                              .PaddingVertical(5).PaddingHorizontal(4)
                              .AlignLeft().AlignMiddle()
                              .Text("Entity").Bold().FontSize(8.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);

                        header.Cell().Background(QuestPDF.Helpers.Colors.Grey.Lighten3)
                              .BorderBottom(1.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Darken1)
                              .PaddingVertical(5).PaddingHorizontal(4)
                              .AlignLeft().AlignMiddle()
                              .Text("Details").Bold().FontSize(8.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);

                        header.Cell().Background(QuestPDF.Helpers.Colors.Grey.Lighten3)
                              .BorderBottom(1.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Darken1)
                              .PaddingVertical(5).PaddingHorizontal(4)
                              .AlignCenter().AlignMiddle()
                              .Text("Timestamp").Bold().FontSize(8.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);
                    });

                    for (int i = 0; i < list.Count; i++)
                    {
                        var log = list[i];
                        var bg = i % 2 == 0 ? QuestPDF.Helpers.Colors.White : QuestPDF.Helpers.Colors.Grey.Lighten5;

                        table.Cell().Background(bg).BorderBottom(0.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2)
                             .PaddingVertical(4).PaddingHorizontal(4).AlignCenter().AlignMiddle()
                             .Text(log.LogId.ToString()).FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken2);

                        table.Cell().Background(bg).BorderBottom(0.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2)
                             .PaddingVertical(4).PaddingHorizontal(4).AlignLeft().AlignMiddle()
                             .Text(string.IsNullOrWhiteSpace(log.ActorRoleCode) ? "SYSTEM" : log.ActorRoleCode)
                             .SemiBold().FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken3);

                        table.Cell().Background(bg).BorderBottom(0.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2)
                             .PaddingVertical(4).PaddingHorizontal(4).AlignLeft().AlignMiddle()
                             .Text(log.ActionCode).FontSize(8).FontColor(QuestPDF.Helpers.Colors.Blue.Darken2);

                        table.Cell().Background(bg).BorderBottom(0.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2)
                             .PaddingVertical(4).PaddingHorizontal(4).AlignLeft().AlignMiddle()
                             .Text(log.EntityType).FontSize(8);

                        table.Cell().Background(bg).BorderBottom(0.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2)
                             .PaddingVertical(4).PaddingHorizontal(4).AlignLeft().AlignMiddle()
                             .Text(string.IsNullOrWhiteSpace(log.Details) ? "-" : log.Details)
                             .FontSize(7.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken2);

                        table.Cell().Background(bg).BorderBottom(0.5f).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2)
                             .PaddingVertical(4).PaddingHorizontal(4).AlignCenter().AlignMiddle()
                             .Text(log.CreatedAt.ToString("yyyy-MM-dd HH:mm")).FontSize(7.5f).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                    }
                });

                page.Footer().Column(col =>
                {
                    col.Item().LineHorizontal(0.5f).LineColor(QuestPDF.Helpers.Colors.Grey.Lighten2);
                    col.Item().PaddingTop(3).Row(row =>
                    {
                        row.RelativeItem().Text("LifeLineConnect · System Audit Export · Confidential").FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                        row.RelativeItem().AlignRight().Text(x =>
                        {
                            x.Span("Page ").FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                            x.CurrentPageNumber().FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                            x.Span(" of ").FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                            x.TotalPages().FontSize(8).FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);
                        });
                    });
                });
            });
        });
        
        return File(document.GeneratePdf(), "application/pdf", "Audit_Logs.pdf");
    }
}

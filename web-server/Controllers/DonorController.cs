using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using Oracle.ManagedDataAccess.Client;
using Oracle.ManagedDataAccess.Types;
using System.Data;
using System.Security.Claims;
using web_server.Data;
using web_server.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace web_server.Controllers;

[ApiController]
[Route("api/donors/me")]
[Authorize(Roles = "DONOR")]
public class DonorController : ControllerBase
{
    private readonly OracleDbContext _oracleDb;
    private readonly MongoDbContext _mongoDb;

    public DonorController(OracleDbContext oracleDb, MongoDbContext mongoDb)
    {
        _oracleDb = oracleDb;
        _mongoDb = mongoDb;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private int GetCurrentUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

        [HttpGet("me/eligibility")]
    public ActionResult<ApiResponse<object>> GetEligibility()
    {
        var userId = GetCurrentUserId();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("CHECK_DONOR_ELIGIBILITY", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = userId;
        var pEligible = new OracleParameter("p_eligible", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
        var pReason = new OracleParameter("p_reason", OracleDbType.Varchar2, 200) { Direction = ParameterDirection.Output };
        var pNextDate = new OracleParameter("p_next_date", OracleDbType.Date) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pEligible);
        cmd.Parameters.Add(pReason);
        cmd.Parameters.Add(pNextDate);
        cmd.ExecuteNonQuery();

        return ApiResponse<object>.Ok(new {
            IsEligible = Convert.ToInt32(pEligible.Value.ToString()) == 1,
            Reason = pReason.Value.ToString(),
            NextEligibleDate = Convert.ToDateTime(pNextDate.Value.ToString())
        });
    }

    [HttpGet("dashboard")]
    public ActionResult<ApiResponse<DonorDashboardDto>> GetDashboard()
    {
        var userId = GetCurrentUserId();
        var dash = new DonorDashboardDto();

        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using (var cmd = new OracleCommand("GET_DONOR_DASHBOARD", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = userId;
            var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResult);
            cmd.ExecuteNonQuery();

            using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
            if (reader.Read())
            {
                dash.TotalDonations = Convert.ToInt32(reader["TOTAL_DONATIONS"]);
                dash.UpcomingCamps = Convert.ToInt32(reader["UPCOMING_CAMPS"]);
                dash.LastDonationDate = reader["LAST_DONATION_DATE"] != DBNull.Value ? Convert.ToDateTime(reader["LAST_DONATION_DATE"]) : null;
            }
        }

        using (var cmd = new OracleCommand("CHECK_DONOR_ELIGIBILITY", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = userId;
            var pEligible = new OracleParameter("p_eligible", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
            var pReason = new OracleParameter("p_reason", OracleDbType.Varchar2, 200) { Direction = ParameterDirection.Output };
            var pNextDate = new OracleParameter("p_next_date", OracleDbType.Date) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pEligible);
            cmd.Parameters.Add(pReason);
            cmd.Parameters.Add(pNextDate);
            cmd.ExecuteNonQuery();

            dash.IsEligible = Convert.ToInt32(pEligible.Value.ToString()) == 1;
            dash.EligibilityReason = pReason.Value.ToString()!;
            dash.NextEligibleDate = Convert.ToDateTime(pNextDate.Value.ToString());
        }

        return ApiResponse<DonorDashboardDto>.Ok(dash);
    }

    [HttpGet("profile")]
    public ActionResult<ApiResponse<DonorProfileDto>> GetProfile()
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_DONOR_PROFILE", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        if (reader.Read())
        {
            var profile = new DonorProfileDto
            {
                DonorId = Convert.ToInt32(reader["DONOR_ID"]),
                FullName = reader["FULL_NAME"].ToString()!,
                Nic = reader["NIC"].ToString()!,
                DateOfBirth = Convert.ToDateTime(reader["DATE_OF_BIRTH"]),
                Gender = reader["GENDER"]?.ToString() ?? "",
                BloodGroup = reader["BLOOD_GROUP"]?.ToString() ?? "",
                Phone = reader["PHONE"]?.ToString() ?? "",
                Email = reader["EMAIL"]?.ToString() ?? "",
                Address = reader["ADDRESS"]?.ToString() ?? "",
                Status = reader["STATUS"].ToString()!
            };
            return ApiResponse<DonorProfileDto>.Ok(profile);
        }
        return NotFound(ApiResponse<DonorProfileDto>.Error("Profile not found"));
    }

    [HttpPut("profile")]
    public ActionResult<ApiResponse<string>> UpdateProfile([FromBody] DonorProfileUpdateDto dto)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("UPDATE_DONOR_PROFILE", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        cmd.Parameters.Add("p_full_name", OracleDbType.Varchar2).Value = dto.FullName;
        cmd.Parameters.Add("p_phone", OracleDbType.Varchar2).Value = dto.Phone;
        cmd.Parameters.Add("p_email", OracleDbType.Varchar2).Value = dto.Email;
        cmd.Parameters.Add("p_address", OracleDbType.Varchar2).Value = dto.Address;
        cmd.Parameters.Add("p_blood_group", OracleDbType.Varchar2).Value = dto.BloodGroup;
        cmd.Parameters.Add("p_gender", OracleDbType.Varchar2).Value = dto.Gender;

        cmd.ExecuteNonQuery();
        return ApiResponse<string>.Ok("Profile updated successfully");
    }

    [HttpPost("camp-registrations")]
    public ActionResult<ApiResponse<object>> RegisterForCamp([FromBody] CampRegistrationRequestDto req)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("REGISTER_DONOR_FOR_CAMP", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        cmd.Parameters.Add("p_camp_id", OracleDbType.Decimal).Value = req.CampId;
        
        var pRegId = new OracleParameter("p_registration_id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
        var pStatus = new OracleParameter("p_status", OracleDbType.Varchar2, 50) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pRegId);
        cmd.Parameters.Add(pStatus);

        cmd.ExecuteNonQuery();

        var status = pStatus.Value.ToString();
        if (status == "ALREADY_REGISTERED")
        {
            return Conflict(ApiResponse<object>.Error("You are already registered for this camp."));
        }

        return ApiResponse<object>.Ok(new { RegistrationId = pRegId.Value.ToString(), Status = status });
    }

    [HttpGet("camp-registrations/upcoming")]
    public ActionResult<ApiResponse<List<object>>> GetUpcomingCamps()
    {
        var list = new List<object>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_DONOR_UPCOMING_REGISTRATIONS", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new
            {
                RegistrationId = Convert.ToInt32(reader["REGISTRATION_ID"]),
                Status = reader["REGISTRATION_STATUS"].ToString(),
                CampId = Convert.ToInt32(reader["CAMP_ID"]),
                CampTitle = reader["CAMP_TITLE"].ToString(),
                CampDate = Convert.ToDateTime(reader["CAMP_DATE"]),
                VenueName = reader["VENUE_NAME"].ToString()
            });
        }
        return ApiResponse<List<object>>.Ok(list);
    }

    [HttpGet("donations")]
    public ActionResult<ApiResponse<List<DonorDonationDto>>> GetDonations()
    {
        var list = new List<DonorDonationDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_DONOR_DONATION_HISTORY", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new DonorDonationDto
            {
                DonationId = Convert.ToInt32(reader["DONATION_ID"]),
                DonationDate = Convert.ToDateTime(reader["DONATION_DATE"]),
                BloodGroup = reader["BLOOD_GROUP"].ToString()!,
                UnitsCollected = Convert.ToDecimal(reader["UNITS_COLLECTED"]),
                Status = reader["STATUS"].ToString()!,
                CampId = Convert.ToInt32(reader["CAMP_ID"]),
                CampTitle = reader["CAMP_TITLE"].ToString()!,
                VenueName = reader["VENUE_NAME"].ToString()!
            });
        }
        return ApiResponse<List<DonorDonationDto>>.Ok(list);
    }

    [HttpGet("status-history")]
    public ActionResult<ApiResponse<List<DonorStatusHistoryDto>>> GetStatusHistory()
    {
        var list = new List<DonorStatusHistoryDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var command = connection.CreateCommand();
        command.CommandType = System.Data.CommandType.StoredProcedure;
        command.CommandText = "GET_DONOR_STATUS_HISTORY";
        
        command.Parameters.Add(new OracleParameter("p_user_id", GetCurrentUserId()));
        
        var pCursor = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = System.Data.ParameterDirection.Output };
        command.Parameters.Add(pCursor);
        
        command.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pCursor.Value).GetDataReader();
        
        while (reader.Read())
        {
            list.Add(new DonorStatusHistoryDto
            {
                EventType = reader["EVENT_TYPE"]?.ToString() ?? "",
                EventDate = Convert.ToDateTime(reader["EVENT_DATE"]),
                EventTitle = reader["EVENT_TITLE"]?.ToString() ?? "",
                Status = reader["STATUS"]?.ToString() ?? "",
                Details = reader["DETAILS"]?.ToString() ?? ""
            });
        }
        
        return ApiResponse<List<DonorStatusHistoryDto>>.Ok(list);
    }

    [HttpGet("donations/report")]
    public IActionResult GenerateDonationReport()
    {
        var donations = GetDonations().Value?.Data ?? new List<DonorDonationDto>();
        var name = User.FindFirst(ClaimTypes.Name)?.Value ?? "Donor";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.Header().Text("Donation History Report").SemiBold().FontSize(24).FontColor(Colors.Red.Medium);
                
                page.Content().PaddingVertical(1, Unit.Centimetre).Column(x =>
                {
                    x.Item().Text($"Donor: {name}").FontSize(14).SemiBold();
                    x.Item().Text($"Date Generated: {DateTime.Now:yyyy-MM-dd HH:mm}").FontSize(10);
                    x.Spacing(20);

                    x.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn();
                            c.RelativeColumn(2);
                            c.RelativeColumn();
                            c.RelativeColumn();
                        });

                        t.Header(h =>
                        {
                            h.Cell().Text("Date").SemiBold();
                            h.Cell().Text("Camp").SemiBold();
                            h.Cell().Text("Venue").SemiBold();
                            h.Cell().Text("Blood Group").SemiBold();
                        });

                        foreach (var d in donations)
                        {
                            t.Cell().Text(d.DonationDate.ToString("yyyy-MM-dd"));
                            t.Cell().Text(d.CampTitle);
                            t.Cell().Text(d.VenueName);
                            t.Cell().Text(d.BloodGroup);
                        }
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        });

        var pdfBytes = document.GeneratePdf();
        return File(pdfBytes, "application/pdf", $"Donation_History_{DateTime.Now:yyyyMMdd}.pdf");
    }

    [HttpPost("camps/{campId}/feedback")]
    public async Task<ActionResult<ApiResponse<object>>> SubmitFeedback(int campId, [FromBody] FeedbackDto req)
    {
        var userId = GetCurrentUserId();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("CAN_SUBMIT_FEEDBACK", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = userId;
        cmd.Parameters.Add("p_camp_id", OracleDbType.Decimal).Value = campId;
        var pAllowed = new OracleParameter("p_allowed", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pAllowed);
        
        cmd.ExecuteNonQuery();

        if (Convert.ToInt32(pAllowed.Value.ToString()) == 0)
        {
            return Forbid("You can only review camps where you have a completed donation.");
        }

        var feedbackCol = _mongoDb.GetCollection<BsonDocument>("campFeedback");
        var doc = new BsonDocument
        {
            { "campId", campId },
            { "donorUserId", userId },
            { "donorName", User.FindFirst(ClaimTypes.Name)?.Value ?? "Anonymous" },
            { "rating", req.Rating },
            { "comment", req.Comment },
            { "status", "PUBLISHED" },
            { "createdAt", DateTime.UtcNow }
        };

        await feedbackCol.InsertOneAsync(doc);
        return ApiResponse<object>.Ok(new { FeedbackId = doc["_id"].ToString() }, "Feedback submitted.");
    }

    [HttpGet("emergency-appeals")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetAppeals()
    {
        var appealsCol = _mongoDb.GetCollection<BsonDocument>("emergencyAppeals");
        var activeAppeals = await appealsCol.Find(Builders<BsonDocument>.Filter.Eq("status", "ACTIVE")).ToListAsync();
        
        var list = activeAppeals.Select(a => new
        {
            AppealId = a["_id"].ToString(),
            PatientReference = a["patientReference"].AsString,
            BloodGroup = a["bloodGroup"].AsString,
            Urgency = a["urgency"].AsString,
            Location = a["location"].AsString,
            NeededBy = a["neededBy"].ToUniversalTime(),
            Summary = a["summary"].AsString
        }).ToList<object>();

        return ApiResponse<List<object>>.Ok(list);
    }

    [HttpPost("emergency-appeals")]
    public async Task<ActionResult<ApiResponse<object>>> SubmitAppeal([FromBody] EmergencyAppealSubmitDto req)
    {
        var appealsCol = _mongoDb.GetCollection<BsonDocument>("emergencyAppeals");
        var doc = new BsonDocument
        {
            { "createdByUserId", GetCurrentUserId() },
            { "patientReference", req.PatientReference },
            { "relationship", req.Relationship },
            { "bloodGroup", req.BloodGroup },
            { "unitsRequired", req.UnitsRequired },
            { "urgency", req.Urgency },
            { "location", req.Location },
            { "neededBy", req.NeededBy },
            { "summary", req.Summary },
            { "status", "PENDING" },
            { "createdAt", DateTime.UtcNow }
        };

        await appealsCol.InsertOneAsync(doc);
        return ApiResponse<object>.Ok(new { AppealId = doc["_id"].ToString() }, "Emergency appeal submitted and is pending review.");
    }

    [HttpPost("community/threads")]
    public async Task<ActionResult<ApiResponse<string>>> CreateThread([FromBody] web_server.Models.Mongo.CommunityThread req)
    {
        req.AuthorName = User.Identity?.Name ?? "Anonymous Donor";
        req.CreatedAt = DateTime.UtcNow;
        var col = _mongoDb.GetCollection<web_server.Models.Mongo.CommunityThread>("communityThreads");
        await col.InsertOneAsync(req);
        return ApiResponse<string>.Ok("Thread created successfully.");
    }

    [HttpPost("community/qa")]
    public async Task<ActionResult<ApiResponse<string>>> CreateQa([FromBody] web_server.Models.Mongo.CommunityQa req)
    {
        req.CreatedAt = DateTime.UtcNow;
        var col = _mongoDb.GetCollection<web_server.Models.Mongo.CommunityQa>("communityQa");
        await col.InsertOneAsync(req);
        return ApiResponse<string>.Ok("Q&A created successfully.");
    }

    public class ReplyRequestDto { public string Content { get; set; } = ""; }
    public class AnswerRequestDto { public string Answer { get; set; } = ""; }

    [HttpPost("community/threads/{threadId}/replies")]
    public async Task<ActionResult<ApiResponse<string>>> CreateReply(string threadId, [FromBody] ReplyRequestDto req)
    {
        var repliesCol = _mongoDb.GetCollection<BsonDocument>("communityReplies");
        var doc = new BsonDocument
        {
            { "threadId", threadId },
            { "content", req.Content },
            { "authorName", User.Identity?.Name ?? "Anonymous Donor" },
            { "createdAt", DateTime.UtcNow }
        };
        await repliesCol.InsertOneAsync(doc);

        // Increment repliesCount on the parent thread
        var threadsCol = _mongoDb.GetCollection<BsonDocument>("communityThreads");
        var filter = Builders<BsonDocument>.Filter.Eq("_id", new MongoDB.Bson.ObjectId(threadId));
        var update = Builders<BsonDocument>.Update.Inc("repliesCount", 1);
        await threadsCol.UpdateOneAsync(filter, update);

        return ApiResponse<string>.Ok("Reply posted successfully.");
    }

    [HttpPost("community/qa/{qaId}/answer")]
    public async Task<ActionResult<ApiResponse<string>>> AnswerQa(string qaId, [FromBody] AnswerRequestDto req)
    {
        var col = _mongoDb.GetCollection<BsonDocument>("communityQa");
        var filter = Builders<BsonDocument>.Filter.Eq("_id", new MongoDB.Bson.ObjectId(qaId));
        var update = Builders<BsonDocument>.Update.Set("answer", req.Answer);
        var result = await col.UpdateOneAsync(filter, update);

        if (result.ModifiedCount == 0)
            return BadRequest(ApiResponse<string>.Error("Question not found."));

        return ApiResponse<string>.Ok("Answer submitted successfully.");
    }
}

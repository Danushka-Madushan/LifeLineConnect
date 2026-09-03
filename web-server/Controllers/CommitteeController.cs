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

namespace web_server.Controllers;

[ApiController]
[Route("api/committee")]
[Authorize(Roles = "ORGANIZING_COMMITTEE")]
public class CommitteeController : ControllerBase
{
    private readonly OracleDbContext _oracleDb;
    private readonly MongoDbContext _mongoDb;

    public CommitteeController(OracleDbContext oracleDb, MongoDbContext mongoDb)
    {
        _oracleDb = oracleDb;
        _mongoDb = mongoDb;
    }

    private int GetCurrentUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet("dashboard")]
    public ActionResult<ApiResponse<CommitteeDashboardDto>> GetDashboard()
    {
        var dash = new CommitteeDashboardDto();

        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_COMMITTEE_DASHBOARD", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);
        
        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        if (reader.Read())
        {
            dash.ActiveCamps = Convert.ToInt32(reader["ACTIVE_CAMPS"]);
            dash.PendingTransfers = Convert.ToInt32(reader["PENDING_TRANSFERS"]);
            dash.TotalRegistrations = Convert.ToInt32(reader["TOTAL_REGISTRATIONS"]);
            dash.ActiveVenues = Convert.ToInt32(reader["ACTIVE_VENUES"]);
        }

        return ApiResponse<CommitteeDashboardDto>.Ok(dash);
    }

    [HttpGet("venues")]
    public ActionResult<ApiResponse<List<VenueDto>>> GetVenues()
    {
        var list = new List<VenueDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_COMMITTEE_VENUES", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new VenueDto
            {
                VenueId = Convert.ToInt32(reader["VENUE_ID"]),
                VenueName = reader["VENUE_NAME"].ToString()!,
                Address = reader["ADDRESS"].ToString()!,
                Capacity = Convert.ToInt32(reader["CAPACITY"]),
                Status = reader["STATUS"].ToString()!
            });
        }
        return ApiResponse<List<VenueDto>>.Ok(list);
    }

    [HttpGet("camps")]
    public ActionResult<ApiResponse<List<CommitteeCampDto>>> GetCamps()
    {
        var list = new List<CommitteeCampDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_COMMITTEE_CAMPS", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new CommitteeCampDto
            {
                CampId = Convert.ToInt32(reader["CAMP_ID"]),
                CampTitle = reader["CAMP_TITLE"].ToString()!,
                CampDate = Convert.ToDateTime(reader["CAMP_DATE"]),
                StartTime = Convert.ToDateTime(reader["START_TIME"]),
                EndTime = Convert.ToDateTime(reader["END_TIME"]),
                Capacity = Convert.ToInt32(reader["CAPACITY"]),
                Status = reader["STATUS"].ToString()!,
                PublicVisible = reader["PUBLIC_VISIBLE"].ToString()!,
                VenueName = reader["VENUE_NAME"].ToString()!
            });
        }
        return ApiResponse<List<CommitteeCampDto>>.Ok(list);
    }

    [HttpPost("camps")]
    public ActionResult<ApiResponse<object>> CreateCamp([FromBody] CreateCampDto req)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("CREATE_DONATION_CAMP", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        cmd.Parameters.Add("p_venue_id", OracleDbType.Decimal).Value = req.VenueId;
        cmd.Parameters.Add("p_title", OracleDbType.Varchar2).Value = req.Title;
        cmd.Parameters.Add("p_date", OracleDbType.Date).Value = req.Date;
        cmd.Parameters.Add("p_start", OracleDbType.TimeStamp).Value = req.StartTime;
        cmd.Parameters.Add("p_end", OracleDbType.TimeStamp).Value = req.EndTime;
        cmd.Parameters.Add("p_capacity", OracleDbType.Decimal).Value = req.Capacity;
        
        var pCampId = new OracleParameter("p_camp_id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pCampId);

        cmd.ExecuteNonQuery();
        return ApiResponse<object>.Ok(new { CampId = Convert.ToInt32(pCampId.Value.ToString()) }, "Camp published successfully.");
    }

    [HttpGet("camps/{campId}/attendance")]
    public ActionResult<ApiResponse<List<CampAttendanceDto>>> GetAttendance(int campId)
    {
        var list = new List<CampAttendanceDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_CAMP_ATTENDANCE", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        cmd.Parameters.Add("p_camp_id", OracleDbType.Decimal).Value = campId;
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new CampAttendanceDto
            {
                RegistrationId = Convert.ToInt32(reader["REGISTRATION_ID"]),
                DonorId = Convert.ToInt32(reader["DONOR_ID"]),
                RegistrationStatus = reader["REGISTRATION_STATUS"].ToString()!,
                AttendanceStatus = reader["ATTENDANCE_STATUS"].ToString()!,
                FullName = reader["FULL_NAME"].ToString()!,
                Nic = reader["NIC"].ToString()!,
                BloodGroup = reader["BLOOD_GROUP"].ToString()!,
                HasDonated = Convert.ToInt32(reader["HAS_DONATED"]) > 0
            });
        }
        return ApiResponse<List<CampAttendanceDto>>.Ok(list);
    }

    [HttpPost("camps/{campId}/donations")]
    public ActionResult<ApiResponse<string>> RecordDonation(int campId, [FromBody] RecordDonationDto req)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("RECORD_CAMP_DONATION", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        cmd.Parameters.Add("p_registration_id", OracleDbType.Decimal).Value = req.RegistrationId;
        cmd.Parameters.Add("p_camp_id", OracleDbType.Decimal).Value = campId;
        cmd.Parameters.Add("p_donor_id", OracleDbType.Decimal).Value = req.DonorId;
        cmd.Parameters.Add("p_blood_group", OracleDbType.Varchar2).Value = req.BloodGroup;
        cmd.Parameters.Add("p_units", OracleDbType.Decimal).Value = req.Units;

        cmd.ExecuteNonQuery();
        return ApiResponse<string>.Ok("Donation logged successfully.");
    }

    [HttpPost("camps/{campId}/transfers")]
    public ActionResult<ApiResponse<object>> DispatchTransfer(int campId, [FromBody] DispatchTransferDto req)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("DISPATCH_DONATION_TRANSFER", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        cmd.Parameters.Add("p_camp_id", OracleDbType.Decimal).Value = campId;
        cmd.Parameters.Add("p_blood_bank_id", OracleDbType.Decimal).Value = req.BloodBankId;
        
        var pTransferId = new OracleParameter("p_transfer_id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
        var pTransferCode = new OracleParameter("p_transfer_code", OracleDbType.Varchar2, 50) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pTransferId);
        cmd.Parameters.Add(pTransferCode);

        cmd.ExecuteNonQuery();
        
        var transferId = Convert.ToInt32(pTransferId.Value.ToString());
        if (transferId == -1)
        {
            return BadRequest(ApiResponse<object>.Error("No completed donations found to transfer, or they have already been transferred."));
        }

        return ApiResponse<object>.Ok(new { 
            TransferId = transferId, 
            TransferCode = pTransferCode.Value.ToString() 
        }, "Donations dispatched to Blood Bank successfully.");
    }

    [HttpGet("camps/{campId}/feedback")]
    public async Task<ActionResult<ApiResponse<List<object>>>> GetCampFeedback(int campId)
    {
        var col = _mongoDb.GetCollection<BsonDocument>("campFeedback");
        var docs = await col.Find(Builders<BsonDocument>.Filter.Eq("campId", campId)).ToListAsync();
        
        var list = docs.Select(d => new
        {
            FeedbackId = d["_id"].ToString(),
            DonorName = d["donorName"].AsString,
            Rating = d["rating"].AsInt32,
            Comment = d["comment"].AsString,
            CreatedAt = d["createdAt"].ToUniversalTime()
        }).ToList<object>();

        return ApiResponse<List<object>>.Ok(list);
    }

    [HttpPatch("camps/{campId}/status")]
    public ActionResult<ApiResponse<string>> UpdateCampStatus(int campId, [FromBody] web_server.Models.UpdateStatusRequest req)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandText = "UPDATE DONATION_CAMP SET STATUS = :status WHERE CAMP_ID = :id AND COMMITTEE_ID = (SELECT COMMITTEE_ID FROM ORGANIZING_COMMITTEE WHERE USER_ID = :userId)";
        cmd.Parameters.Add(new OracleParameter("status", req.Status));
        cmd.Parameters.Add(new OracleParameter("id", campId));
        cmd.Parameters.Add(new OracleParameter("userId", GetCurrentUserId()));
        
        var rows = cmd.ExecuteNonQuery();
        if (rows == 0) return ApiResponse<string>.Error("Camp not found or unauthorized");
        return ApiResponse<string>.Ok("Camp status updated.");
    }

    [HttpPost("venues")]
    public ActionResult<ApiResponse<object>> CreateVenue([FromBody] web_server.Models.VenueDto req)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO VENUE (COMMITTEE_ID, VENUE_NAME, ADDRESS, LATITUDE, LONGITUDE, CAPACITY, STATUS) 
            VALUES ((SELECT COMMITTEE_ID FROM ORGANIZING_COMMITTEE WHERE USER_ID = :userId), :vn, :add, :lat, :lng, :cap, 'ACTIVE')
            RETURNING VENUE_ID INTO :id";
        cmd.Parameters.Add(new OracleParameter("userId", GetCurrentUserId()));
        cmd.Parameters.Add(new OracleParameter("vn", req.VenueName));
        cmd.Parameters.Add(new OracleParameter("add", req.Address));
        cmd.Parameters.Add(new OracleParameter("lat", 0)); // Mocking default
        cmd.Parameters.Add(new OracleParameter("lng", 0));
        cmd.Parameters.Add(new OracleParameter("cap", req.Capacity));
        var pId = new OracleParameter("id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pId);
        
        cmd.ExecuteNonQuery();
        return ApiResponse<object>.Ok(new { VenueId = pId.Value.ToString() });
    }

    [HttpGet("transfers")]
    public ActionResult<ApiResponse<List<object>>> GetTransfers()
    {
        var list = new List<object>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            SELECT TRANSFER_ID, TRANSFER_CODE, STATUS, DISPATCHED_AT, RECEIVED_AT
            FROM DONATION_TRANSFER
            WHERE COMMITTEE_ID = (SELECT COMMITTEE_ID FROM ORGANIZING_COMMITTEE WHERE USER_ID = :userId)
            ORDER BY DISPATCHED_AT DESC";
        cmd.Parameters.Add(new OracleParameter("userId", GetCurrentUserId()));
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            list.Add(new {
                TransferId = reader["TRANSFER_ID"],
                TransferCode = reader["TRANSFER_CODE"],
                Status = reader["STATUS"],
                DispatchedAt = reader["DISPATCHED_AT"],
                ReceivedAt = reader["RECEIVED_AT"] != DBNull.Value ? reader["RECEIVED_AT"] : null
            });
        }
        return ApiResponse<List<object>>.Ok(list);
    }

    [HttpGet("staff")]
    public ActionResult<ApiResponse<List<web_server.Models.BankStaffDto>>> GetStaff()
    {
        var list = new List<web_server.Models.BankStaffDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            SELECT STAFF_ID, FULL_NAME, POSITION_TITLE, PHONE, EMAIL, ASSIGNED_FROM, STATUS
            FROM STAFF_MEMBER 
            WHERE COMMITTEE_ID = (SELECT COMMITTEE_ID FROM ORGANIZING_COMMITTEE WHERE USER_ID = :userId)";
        cmd.Parameters.Add(new OracleParameter("userId", GetCurrentUserId()));
        
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            list.Add(new web_server.Models.BankStaffDto
            {
                StaffId = Convert.ToInt32(reader["STAFF_ID"]),
                FullName = reader["FULL_NAME"].ToString()!,
                PositionTitle = reader["POSITION_TITLE"].ToString()!,
                Phone = reader["PHONE"].ToString()!,
                Email = reader["EMAIL"].ToString()!,
                AssignedFrom = Convert.ToDateTime(reader["ASSIGNED_FROM"]),
                Status = reader["STATUS"].ToString()!
            });
        }
        return ApiResponse<List<web_server.Models.BankStaffDto>>.Ok(list);
    }

    [HttpPost("staff")]
    public ActionResult<ApiResponse<object>> AddStaff([FromBody] web_server.Models.BankStaffDto req)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO STAFF_MEMBER (COMMITTEE_ID, FULL_NAME, POSITION_TITLE, PHONE, EMAIL, ASSIGNED_FROM, STATUS) 
            VALUES ((SELECT COMMITTEE_ID FROM ORGANIZING_COMMITTEE WHERE USER_ID = :userId), :fn, :pt, :ph, :em, CURRENT_DATE, 'ACTIVE')
            RETURNING STAFF_ID INTO :id";
        
        cmd.Parameters.Add(new OracleParameter("userId", GetCurrentUserId()));
        cmd.Parameters.Add(new OracleParameter("fn", req.FullName));
        cmd.Parameters.Add(new OracleParameter("pt", req.PositionTitle));
        cmd.Parameters.Add(new OracleParameter("ph", req.Phone));
        cmd.Parameters.Add(new OracleParameter("em", req.Email));
        
        var idParam = new OracleParameter("id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(idParam);
        
        cmd.ExecuteNonQuery();
        return ApiResponse<object>.Ok(new { StaffId = idParam.Value.ToString() });
    }

    [HttpDelete("staff/{staffId}")]
    public ActionResult<ApiResponse<string>> DeleteStaff(int staffId)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandText = "UPDATE STAFF_MEMBER SET STATUS = 'INACTIVE' WHERE STAFF_ID = :id AND COMMITTEE_ID = (SELECT COMMITTEE_ID FROM ORGANIZING_COMMITTEE WHERE USER_ID = :userId)";
        cmd.Parameters.Add(new OracleParameter("id", staffId));
        cmd.Parameters.Add(new OracleParameter("userId", GetCurrentUserId()));
        cmd.ExecuteNonQuery();
        return ApiResponse<string>.Ok("Staff removed");
    }

    [HttpPost("awareness")]
    public async Task<ActionResult<ApiResponse<string>>> PostAwarenessMaterial([FromBody] web_server.Models.Mongo.AwarenessMaterial req)
    {
        req.CreatedAt = DateTime.UtcNow;
        var col = _mongoDb.GetCollection<web_server.Models.Mongo.AwarenessMaterial>("campaignMedia");
        await col.InsertOneAsync(req);
        return ApiResponse<string>.Ok("Awareness material posted.");
    }

    [HttpGet("reports/camps")]
    public ActionResult GenerateCampsReport()
    {
        var camps = GetCamps().Value?.Data ?? new List<CommitteeCampDto>();
        var document = QuestPDF.Fluent.Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(QuestPDF.Helpers.PageSizes.A4);
                page.Margin(2, QuestPDF.Infrastructure.Unit.Centimetre);
                page.Header().Text("Committee Camps Report").SemiBold().FontSize(24).FontColor(QuestPDF.Helpers.Colors.Red.Medium);
                
                page.Content().PaddingVertical(1, QuestPDF.Infrastructure.Unit.Centimetre).Column(x =>
                {
                    x.Item().Text($"Date Generated: {DateTime.Now:yyyy-MM-dd HH:mm}").FontSize(10);
                    x.Spacing(20);
                    x.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(2);
                            c.RelativeColumn();
                            c.RelativeColumn();
                        });
                        t.Header(h =>
                        {
                            h.Cell().Text("Camp").SemiBold();
                            h.Cell().Text("Date").SemiBold();
                            h.Cell().Text("Status").SemiBold();
                        });
                        foreach (var camp in camps)
                        {
                            t.Cell().Text(camp.CampTitle);
                            t.Cell().Text(camp.CampDate.ToShortDateString());
                            t.Cell().Text(camp.Status);
                        }
                    });
                });
            });
        });
        return File(document.GeneratePdf(), "application/pdf", "Camps_Report.pdf");
    }
}

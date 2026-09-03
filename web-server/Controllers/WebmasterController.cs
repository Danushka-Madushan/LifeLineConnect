using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using Oracle.ManagedDataAccess.Client;
using Oracle.ManagedDataAccess.Types;
using System.Data;
using web_server.Data;
using web_server.Models;

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
}

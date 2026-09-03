using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using web_server.Data;
using web_server.Models;
using web_server.Models.Mongo;
using web_server.Models.Oracle;

using System.Data;
using Oracle.ManagedDataAccess.Client;
using Oracle.ManagedDataAccess.Types;
namespace web_server.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly MongoDbContext _mongoDb;
    private readonly OracleDbContext _oracleDb;
    
    private readonly IMongoCollection<EmergencyBroadcast> _broadcasts;
    private readonly IMongoCollection<EmergencyAppeal> _appeals;
    private readonly IMongoCollection<AwarenessMaterial> _awarenessMaterials;
    private readonly IMongoCollection<PromotionalMedia> _promotionalMedia;
    private readonly IMongoCollection<MedicalGuideline> _medicalGuidelines;
    private readonly IMongoCollection<CommunityThread> _threads;
    private readonly IMongoCollection<CommunityQa> _qa;
    private readonly IMongoCollection<CampFeedback> _feedback;

    public PublicController(MongoDbContext mongoDb, OracleDbContext oracleDb)
    {
        _mongoDb = mongoDb;
        _oracleDb = oracleDb;
        
        _broadcasts = mongoDb.GetCollection<EmergencyBroadcast>("emergencyBroadcasts");
        _appeals = mongoDb.GetCollection<EmergencyAppeal>("emergencyAppeals");
        _awarenessMaterials = mongoDb.GetCollection<AwarenessMaterial>("campaignMedia");
        _promotionalMedia = mongoDb.GetCollection<PromotionalMedia>("promotionalMedia");
        _medicalGuidelines = mongoDb.GetCollection<MedicalGuideline>("medicalGuidelines");
        _threads = mongoDb.GetCollection<CommunityThread>("communityThreads");
        _qa = mongoDb.GetCollection<CommunityQa>("communityQa");
        _feedback = mongoDb.GetCollection<CampFeedback>("campFeedback");
    }

    [HttpGet("emergency-broadcasts")]
    public async Task<ActionResult<ApiResponse<List<EmergencyBroadcast>>>> GetEmergencyBroadcasts()
    {
        var filter = Builders<EmergencyBroadcast>.Filter.Eq(b => b.IsActive, true) & 
                     (Builders<EmergencyBroadcast>.Filter.Gt(b => b.ExpiresAt, DateTime.UtcNow) | 
                      Builders<EmergencyBroadcast>.Filter.Eq(b => b.ExpiresAt, null));
                      
        var activeBroadcasts = await _broadcasts.Find(filter)
                                              .SortByDescending(b => b.CreatedAt)
                                              .ToListAsync();

        return ApiResponse<List<EmergencyBroadcast>>.Ok(activeBroadcasts);
    }

    [HttpGet("emergency-appeals")]
    public async Task<ActionResult<ApiResponse<List<EmergencyAppeal>>>> GetEmergencyAppeals()
    {
        var activeAppeals = await _appeals.Find(a => a.Status == "ACTIVE")
                                        .SortByDescending(a => a.CreatedAt)
                                        .Limit(10)
                                        .ToListAsync();

        return ApiResponse<List<EmergencyAppeal>>.Ok(activeAppeals);
    }

    [HttpGet("emergency-appeals/search")]
    public async Task<ActionResult<ApiResponse<List<EmergencyAppeal>>>> SearchEmergencyAppeals(
        [FromQuery] string? bloodGroup,
        [FromQuery] string? location,
        [FromQuery] string? urgencyLevel)
    {
        var builder = Builders<EmergencyAppeal>.Filter;
        var filter = builder.Eq(a => a.Status, "ACTIVE");

        if (!string.IsNullOrEmpty(bloodGroup))
            filter &= builder.Eq(a => a.BloodGroup, bloodGroup);
        if (!string.IsNullOrEmpty(location))
            filter &= builder.Regex(a => a.Location, new BsonRegularExpression(location, "i"));
        if (!string.IsNullOrEmpty(urgencyLevel))
            filter &= builder.Eq(a => a.UrgencyLevel, urgencyLevel);

        var results = await _appeals.Find(filter)
                                    .SortByDescending(a => a.CreatedAt)
                                    .Limit(50)
                                    .ToListAsync();

        return ApiResponse<List<EmergencyAppeal>>.Ok(results);
    }

    [HttpGet("camps/awareness-materials")]
    public async Task<ActionResult<ApiResponse<List<AwarenessMaterial>>>> GetAwarenessMaterials([FromQuery] int? campId)
    {
        var builder = Builders<AwarenessMaterial>.Filter;
        var filter = builder.Eq(m => m.Published, true);
        
        if (campId.HasValue)
        {
            filter &= builder.Eq(m => m.CampId, campId.Value);
        }

        var materials = await _awarenessMaterials.Find(filter)
                                                .SortByDescending(m => m.CreatedAt)
                                                .ToListAsync();
        return ApiResponse<List<AwarenessMaterial>>.Ok(materials);
    }

    [HttpGet("promotional-media")]
    public async Task<ActionResult<ApiResponse<List<PromotionalMedia>>>> GetPromotionalMedia()
    {
        var media = await _promotionalMedia.Find(m => m.IsActive)
                                          .SortByDescending(m => m.CreatedAt)
                                          .ToListAsync();
        return ApiResponse<List<PromotionalMedia>>.Ok(media);
    }

    [HttpGet("medical-guidelines")]
    public async Task<ActionResult<ApiResponse<List<MedicalGuideline>>>> GetMedicalGuidelines([FromQuery] string? category)
    {
        var builder = Builders<MedicalGuideline>.Filter;
        var filter = builder.Empty;
        
        if (!string.IsNullOrEmpty(category))
            filter &= builder.Eq(g => g.Category, category);

        var guidelines = await _medicalGuidelines.Find(filter)
                                                .SortByDescending(g => g.LastUpdated)
                                                .ToListAsync();
        return ApiResponse<List<MedicalGuideline>>.Ok(guidelines);
    }

    [HttpGet("community/threads")]
    public async Task<ActionResult<ApiResponse<List<CommunityThread>>>> GetCommunityThreads()
    {
        var threads = await _threads.Find(_ => true)
                                  .SortByDescending(t => t.CreatedAt)
                                  .Limit(20)
                                  .ToListAsync();
        return ApiResponse<List<CommunityThread>>.Ok(threads);
    }

    [HttpGet("community/threads/search")]
    public async Task<ActionResult<ApiResponse<List<CommunityThread>>>> SearchCommunityThreads([FromQuery] string query)
    {
        var filter = Builders<CommunityThread>.Filter.Empty;
        if (!string.IsNullOrEmpty(query))
        {
            var regex = new BsonRegularExpression(query, "i");
            filter = Builders<CommunityThread>.Filter.Or(
                Builders<CommunityThread>.Filter.Regex(t => t.Title, regex),
                Builders<CommunityThread>.Filter.Regex(t => t.Content, regex)
            );
        }

        var results = await _threads.Find(filter)
                                   .SortByDescending(t => t.CreatedAt)
                                   .Limit(50)
                                   .ToListAsync();
        return ApiResponse<List<CommunityThread>>.Ok(results);
    }

    [HttpGet("community/qa")]
    public async Task<ActionResult<ApiResponse<List<CommunityQa>>>> GetCommunityQa()
    {
        var qas = await _qa.Find(_ => true)
                          .SortByDescending(q => q.HelpfulCount)
                          .Limit(50)
                          .ToListAsync();
        return ApiResponse<List<CommunityQa>>.Ok(qas);
    }

        [HttpGet("blood-banks")]
    public ActionResult<ApiResponse<List<object>>> GetActiveBloodBanks()
    {
        var list = new List<object>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.CommandText = "GET_ACTIVE_BLOOD_BANKS";

        var pCursor = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pCursor);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pCursor.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new {
                BloodBankId = reader["BLOOD_BANK_ID"],
                BankName = reader["BANK_NAME"],
                Address = reader["ADDRESS"]
            });
        }
        return ApiResponse<List<object>>.Ok(list);
    }

    [HttpGet("camps")]
    public ActionResult<ApiResponse<List<DonationCamp>>> GetPublicCamps([FromQuery] double? lat, [FromQuery] double? lng, [FromQuery] string? status)
    {
        var camps = new List<DonationCamp>();
        using var connection = _oracleDb.CreateConnection();
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandType = System.Data.CommandType.StoredProcedure;
        command.CommandText = "GET_PUBLIC_CAMPS";
        
        command.Parameters.Add(new OracleParameter("p_status", string.IsNullOrEmpty(status) ? (object)DBNull.Value : status));
        command.Parameters.Add(new OracleParameter("p_lat", lat.HasValue ? (object)lat.Value : DBNull.Value));
        command.Parameters.Add(new OracleParameter("p_lng", lng.HasValue ? (object)lng.Value : DBNull.Value));
        
        var pCursor = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        command.Parameters.Add(pCursor);
        
        command.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pCursor.Value).GetDataReader();
        while (reader.Read())
        {
            camps.Add(new DonationCamp
            {
                CampId = Convert.ToInt32(reader["CAMP_ID"]),
                CommitteeId = Convert.ToInt32(reader["COMMITTEE_ID"]),
                VenueId = Convert.ToInt32(reader["VENUE_ID"]),
                CampTitle = reader["CAMP_TITLE"]?.ToString() ?? "",
                CampDescription = reader["CAMP_DESCRIPTION"]?.ToString() ?? "",
                CampDate = Convert.ToDateTime(reader["CAMP_DATE"]),
                StartTime = Convert.ToDateTime(reader["START_TIME"]),
                EndTime = Convert.ToDateTime(reader["END_TIME"]),
                Capacity = Convert.ToInt32(reader["CAPACITY"]),
                Status = reader["STATUS"]?.ToString() ?? "",
                PublicVisible = reader["PUBLIC_VISIBLE"]?.ToString() ?? ""
            });
        }

        return ApiResponse<List<DonationCamp>>.Ok(camps);
    }

    [HttpGet("camps/top-rated")]
    public async Task<ActionResult<ApiResponse<List<TopRatedCampDto>>>> GetTopRatedCamps()
    {
        // 1. Aggregate in Mongo to get top camps by rating
        var topCampStats = await _feedback.Aggregate()
            .Group(f => f.CampId, g => new { 
                CampId = g.Key, 
                AverageRating = g.Average(x => x.Rating), 
                Count = g.Count() 
            })
            .Match(x => x.Count >= 3) // At least 3 reviews
            .SortByDescending(x => x.AverageRating)
            .Limit(5)
            .ToListAsync();

        if (!topCampStats.Any()) return ApiResponse<List<TopRatedCampDto>>.Ok(new List<TopRatedCampDto>());

        // 2. Fetch those camps from Oracle
        var campIdsStr = string.Join(",", topCampStats.Select(x => x.CampId));
        var campsDict = new Dictionary<int, DonationCamp>();
        
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var command = connection.CreateCommand();
        command.CommandType = System.Data.CommandType.StoredProcedure;
        command.CommandText = "GET_CAMPS_BY_IDS";
        
        command.Parameters.Add(new OracleParameter("p_camp_ids", OracleDbType.Varchar2) { Value = campIdsStr });
        
        var pCursor = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = System.Data.ParameterDirection.Output };
        command.Parameters.Add(pCursor);
        
        command.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pCursor.Value).GetDataReader();
        while (reader.Read())
        {
            var campId = Convert.ToInt32(reader["CAMP_ID"]);
            campsDict[campId] = new DonationCamp
            {
                CampId = campId,
                CommitteeId = Convert.ToInt32(reader["COMMITTEE_ID"]),
                VenueId = Convert.ToInt32(reader["VENUE_ID"]),
                CampTitle = reader["CAMP_TITLE"]?.ToString() ?? "",
                CampDescription = reader["CAMP_DESCRIPTION"]?.ToString() ?? "",
                CampDate = Convert.ToDateTime(reader["CAMP_DATE"]),
                StartTime = Convert.ToDateTime(reader["START_TIME"]),
                EndTime = Convert.ToDateTime(reader["END_TIME"]),
                Capacity = Convert.ToInt32(reader["CAPACITY"]),
                Status = reader["STATUS"]?.ToString() ?? "",
                PublicVisible = reader["PUBLIC_VISIBLE"]?.ToString() ?? ""
            };
        }

        // 3. Combine results
        var result = new List<TopRatedCampDto>();
        foreach (var stat in topCampStats)
        {
            if (campsDict.TryGetValue(stat.CampId, out var camp))
            {
                result.Add(new TopRatedCampDto
                {
                    Camp = camp,
                    AverageRating = stat.AverageRating,
                    ReviewCount = stat.Count
                });
            }
        }

        return ApiResponse<List<TopRatedCampDto>>.Ok(result);
    }

    [HttpGet("camps/{campId}/feedback")]
    public async Task<ActionResult<ApiResponse<List<CampFeedback>>>> GetCampFeedback(int campId)
    {
        var feedback = await _feedback.Find(f => f.CampId == campId)
                                     .SortByDescending(f => f.CreatedAt)
                                     .ToListAsync();
        return ApiResponse<List<CampFeedback>>.Ok(feedback);
    }

    [HttpGet("stats")]
    public ActionResult<ApiResponse<SystemStats>> GetSystemStats()
    {
        using var connection = _oracleDb.CreateConnection();
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandType = System.Data.CommandType.StoredProcedure;
        command.CommandText = "GET_PUBLIC_STATS";
        
        var pCursor = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        command.Parameters.Add(pCursor);
        
        command.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pCursor.Value).GetDataReader();
        if (reader.Read())
        {
            var units = Convert.ToDouble(reader["TOTAL_UNITS"]);
            var stats = new SystemStats
            {
                TotalDonors = Convert.ToInt32(reader["TOTAL_DONORS"]),
                ActiveCamps = Convert.ToInt32(reader["ACTIVE_CAMPS"]),
                // Approx 450ml per unit
                LitersCollected = units * 0.45
            };
            return ApiResponse<SystemStats>.Ok(stats);
        }

        return ApiResponse<SystemStats>.Error("Failed to fetch stats");
    }
}


using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using System.Security.Claims;
using web_server.Data;
using web_server.Models;

namespace web_server.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly OracleDbContext _oracleDb;

    public NotificationController(OracleDbContext oracleDb)
    {
        _oracleDb = oracleDb;
    }

    private int GetCurrentUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet]
    public ActionResult<ApiResponse<List<object>>> GetNotifications()
    {
        var list = new List<object>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            SELECT NOTIFICATION_ID, NOTIFICATION_TYPE, TITLE, MESSAGE, ACTION_PATH, IS_READ, CREATED_AT 
            FROM NOTIFICATION 
            WHERE USER_ID = :userId
            ORDER BY CREATED_AT DESC 
            FETCH FIRST 50 ROWS ONLY";
        cmd.Parameters.Add(new OracleParameter("userId", GetCurrentUserId()));

        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            list.Add(new
            {
                Id = Convert.ToInt32(reader["NOTIFICATION_ID"]),
                Type = reader["NOTIFICATION_TYPE"].ToString(),
                Title = reader["TITLE"].ToString(),
                Message = reader["MESSAGE"].ToString(),
                ActionPath = reader["ACTION_PATH"]?.ToString(),
                IsRead = reader["IS_READ"].ToString() == "Y",
                CreatedAt = Convert.ToDateTime(reader["CREATED_AT"])
            });
        }
        return ApiResponse<List<object>>.Ok(list);
    }

    [HttpPost("{id}/read")]
    public ActionResult<ApiResponse<string>> MarkAsRead(int id)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandText = "UPDATE NOTIFICATION SET IS_READ = 'Y' WHERE NOTIFICATION_ID = :id AND USER_ID = :userId";
        cmd.Parameters.Add(new OracleParameter("id", id));
        cmd.Parameters.Add(new OracleParameter("userId", GetCurrentUserId()));
        cmd.ExecuteNonQuery();

        return ApiResponse<string>.Ok("Marked as read");
    }
}

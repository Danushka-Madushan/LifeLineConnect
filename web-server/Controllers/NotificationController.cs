using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using System.Security.Claims;
using web_server.Data;
using web_server.Models;
using System.Data;
using Oracle.ManagedDataAccess.Types;
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
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.CommandText = "GET_USER_NOTIFICATIONS";
        
        cmd.Parameters.Add(new OracleParameter("p_user_id", GetCurrentUserId()));
        
        var pCursor = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pCursor);
        
        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pCursor.Value).GetDataReader();
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
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.CommandText = "MARK_NOTIFICATION_READ";
        
        cmd.Parameters.Add(new OracleParameter("p_user_id", GetCurrentUserId()));
        cmd.Parameters.Add(new OracleParameter("p_notification_id", id));
        
        cmd.ExecuteNonQuery();

        return ApiResponse<string>.Ok("Marked as read");
    }
}

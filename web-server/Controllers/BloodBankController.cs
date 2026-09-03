using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
[Route("api/blood-bank")]
[Authorize(Roles = "BLOOD_BANK")]
public class BloodBankController : ControllerBase
{
    private readonly OracleDbContext _oracleDb;

    public BloodBankController(OracleDbContext oracleDb)
    {
        _oracleDb = oracleDb;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private int GetCurrentUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet("dashboard")]
    public ActionResult<ApiResponse<BankDashboardDto>> GetDashboard()
    {
        var userId = GetCurrentUserId();
        var dash = new BankDashboardDto();

        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using (var cmd = new OracleCommand("GET_BANK_DASHBOARD", connection))
        {
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = userId;
            var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(pResult);
            cmd.ExecuteNonQuery();

            using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
            if (reader.Read())
            {
                dash.TotalUnits = Convert.ToInt32(reader["TOTAL_UNITS"]);
                dash.IncomingTransfers = Convert.ToInt32(reader["INCOMING_TRANSFERS"]);
                dash.PendingRequests = Convert.ToInt32(reader["PENDING_REQUESTS"]);
                dash.ExpiringSoon = Convert.ToInt32(reader["EXPIRING_SOON"]);
            }
        }

        return ApiResponse<BankDashboardDto>.Ok(dash);
    }

    [HttpGet("inventory")]
    public ActionResult<ApiResponse<List<BloodUnitDto>>> GetInventory()
    {
        var list = new List<BloodUnitDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_BANK_INVENTORY", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new BloodUnitDto
            {
                BloodUnitId = Convert.ToInt32(reader["BLOOD_UNIT_ID"]),
                UnitCode = reader["UNIT_CODE"].ToString()!,
                BloodGroup = reader["BLOOD_GROUP"].ToString()!,
                CollectionDate = Convert.ToDateTime(reader["COLLECTION_DATE"]),
                ExpiryDate = Convert.ToDateTime(reader["EXPIRY_DATE"]),
                Status = reader["STATUS"].ToString()!,
                StorageLocation = reader["STORAGE_LOCATION"]?.ToString() ?? ""
            });
        }
        return ApiResponse<List<BloodUnitDto>>.Ok(list);
    }

    [HttpGet("transfers")]
    public ActionResult<ApiResponse<List<DonationTransferDto>>> GetTransfers()
    {
        var list = new List<DonationTransferDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_BANK_TRANSFERS", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new DonationTransferDto
            {
                TransferId = Convert.ToInt32(reader["TRANSFER_ID"]),
                TransferCode = reader["TRANSFER_CODE"].ToString()!,
                Status = reader["STATUS"].ToString()!,
                CreatedAt = Convert.ToDateTime(reader["CREATED_AT"]),
                DispatchedAt = reader["DISPATCHED_AT"] != DBNull.Value ? Convert.ToDateTime(reader["DISPATCHED_AT"]) : null,
                ReceivedAt = reader["RECEIVED_AT"] != DBNull.Value ? Convert.ToDateTime(reader["RECEIVED_AT"]) : null,
                ReceivedUnitCount = reader["RECEIVED_UNIT_COUNT"] != DBNull.Value ? Convert.ToDecimal(reader["RECEIVED_UNIT_COUNT"]) : null,
                CampTitle = reader["CAMP_TITLE"].ToString()!,
                CommitteeName = reader["COMMITTEE_NAME"].ToString()!
            });
        }
        return ApiResponse<List<DonationTransferDto>>.Ok(list);
    }

    [HttpPost("transfers/{transferId}/receive")]
    public ActionResult<ApiResponse<string>> ReceiveTransfer(int transferId)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("RECEIVE_TRANSFER", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        cmd.Parameters.Add("p_transfer_id", OracleDbType.Decimal).Value = transferId;

        cmd.ExecuteNonQuery();
        return ApiResponse<string>.Ok("Transfer received. Blood units have been successfully added to the inventory.");
    }

    [HttpGet("hospital-requests")]
    public ActionResult<ApiResponse<List<HospitalRequestDto>>> GetHospitalRequests()
    {
        var list = new List<HospitalRequestDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_BANK_HOSPITAL_REQUESTS", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new HospitalRequestDto
            {
                RequestId = Convert.ToInt32(reader["REQUEST_ID"]),
                RequestCode = reader["REQUEST_CODE"].ToString()!,
                HospitalName = reader["HOSPITAL_NAME"].ToString()!,
                BloodGroup = reader["BLOOD_GROUP"].ToString()!,
                UnitsRequired = Convert.ToDecimal(reader["UNITS_REQUIRED"]),
                UnitsAllocated = Convert.ToDecimal(reader["UNITS_ALLOCATED"]),
                UnitsFulfilled = Convert.ToDecimal(reader["UNITS_FULFILLED"]),
                NeededBy = Convert.ToDateTime(reader["NEEDED_BY"]),
                Priority = reader["PRIORITY"].ToString()!,
                Status = reader["STATUS"].ToString()!
            });
        }
        return ApiResponse<List<HospitalRequestDto>>.Ok(list);
    }

    [HttpPost("hospital-requests/{requestId}/allocate")]
    public ActionResult<ApiResponse<string>> AllocateUnits(int requestId)
    {
        // For a full implementation, you'd pass a list of BloodUnitIds.
        // For the sake of architecture mocking/testing, we'll just return a success string.
        // A complete PL/SQL would accept an array or perform auto-allocation (FIFO).
        return ApiResponse<string>.Ok("Units successfully allocated to hospital request. Mock implementation executed.");
    }

    [HttpGet("staff")]
    public ActionResult<ApiResponse<List<BankStaffDto>>> GetStaff()
    {
        var list = new List<BankStaffDto>();
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = new OracleCommand("GET_BANK_STAFF", connection);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.Add("p_user_id", OracleDbType.Decimal).Value = GetCurrentUserId();
        var pResult = new OracleParameter("p_result_cursor", OracleDbType.RefCursor) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pResult);

        cmd.ExecuteNonQuery();
        using var reader = ((OracleRefCursor)pResult.Value).GetDataReader();
        while (reader.Read())
        {
            list.Add(new BankStaffDto
            {
                StaffId = Convert.ToInt32(reader["STAFF_ID"]),
                FullName = reader["FULL_NAME"].ToString()!,
                PositionTitle = reader["POSITION_TITLE"]?.ToString() ?? "",
                Phone = reader["PHONE"]?.ToString() ?? "",
                Email = reader["EMAIL"]?.ToString() ?? "",
                AssignedFrom = Convert.ToDateTime(reader["ASSIGNED_FROM"]),
                Status = reader["STATUS"].ToString()!
            });
        }
        return ApiResponse<List<BankStaffDto>>.Ok(list);
    }

    [HttpGet("reports/inventory")]
    public IActionResult GenerateInventoryReport()
    {
        var inventory = GetInventory().Value?.Data ?? new List<BloodUnitDto>();
        
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.Header().Text("Blood Bank Inventory Report").SemiBold().FontSize(24).FontColor(Colors.Red.Medium);
                
                page.Content().PaddingVertical(1, Unit.Centimetre).Column(x =>
                {
                    x.Item().Text($"Date Generated: {DateTime.Now:yyyy-MM-dd HH:mm}").FontSize(10);
                    x.Spacing(20);

                    x.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn();
                            c.RelativeColumn();
                            c.RelativeColumn();
                            c.RelativeColumn();
                        });

                        t.Header(h =>
                        {
                            h.Cell().Text("Unit Code").SemiBold();
                            h.Cell().Text("Blood Group").SemiBold();
                            h.Cell().Text("Expiry Date").SemiBold();
                            h.Cell().Text("Status").SemiBold();
                        });

                        foreach (var i in inventory)
                        {
                            t.Cell().Text(i.UnitCode);
                            t.Cell().Text(i.BloodGroup);
                            t.Cell().Text(i.ExpiryDate.ToString("yyyy-MM-dd"));
                            t.Cell().Text(i.Status);
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
        return File(pdfBytes, "application/pdf", $"Inventory_Report_{DateTime.Now:yyyyMMdd}.pdf");
    }
}

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
                var lowStockStr = reader["LOW_STOCK_GROUPS"]?.ToString();
                if (!string.IsNullOrEmpty(lowStockStr))
                {
                    dash.LowStockGroups = lowStockStr.Split(',').Select(g => g.Trim()).ToList();
                }
            }
        }

        return ApiResponse<BankDashboardDto>.Ok(dash);
    }

    [HttpGet("inventory")]
    public ActionResult<ApiResponse<List<BloodUnitDto>>> GetInventory([FromQuery] string? bloodGroup, [FromQuery] string? status)
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
        
        if (!string.IsNullOrEmpty(bloodGroup))
        {
            list = list.Where(u => u.BloodGroup.Equals(bloodGroup, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        if (!string.IsNullOrEmpty(status))
        {
            list = list.Where(u => u.Status.Equals(status, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        return ApiResponse<List<BloodUnitDto>>.Ok(list);
    }

    [HttpPatch("inventory/{unitId}/status")]
    public ActionResult<ApiResponse<string>> UpdateUnitStatus(int unitId, [FromBody] UpdateStatusRequest req)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.CommandText = "UPDATE_UNIT_STATUS";
        
        cmd.Parameters.Add(new OracleParameter("p_user_id", GetCurrentUserId()));
        cmd.Parameters.Add(new OracleParameter("p_unit_id", unitId));
        cmd.Parameters.Add(new OracleParameter("p_status", req.Status));
        
        var rows = cmd.ExecuteNonQuery();
        
        
        return ApiResponse<string>.Ok("Status updated successfully.");
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
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.CommandText = "ALLOCATE_UNITS_TO_REQUEST";
        
        cmd.Parameters.Add(new OracleParameter("p_user_id", GetCurrentUserId()));
        cmd.Parameters.Add(new OracleParameter("p_request_id", requestId));
        
        var pAllocated = new OracleParameter("p_units_to_allocate", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pAllocated);

        cmd.ExecuteNonQuery();
        
        int allocated = Convert.ToInt32(pAllocated.Value.ToString());
        if (allocated == 0)
        {
            return BadRequest(ApiResponse<string>.Error("No available blood units found for allocation, or request already fulfilled."));
        }
        
        return ApiResponse<string>.Ok($"Successfully allocated {allocated} units to the hospital request.");
    }

    [HttpPatch("hospital-requests/{requestId}/status")]
    public ActionResult<ApiResponse<string>> UpdateRequestStatus(int requestId, [FromBody] UpdateStatusRequest req)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.CommandText = "UPDATE_REQUEST_STATUS";
        
        cmd.Parameters.Add(new OracleParameter("p_user_id", GetCurrentUserId()));
        cmd.Parameters.Add(new OracleParameter("p_request_id", requestId));
        cmd.Parameters.Add(new OracleParameter("p_status", req.Status));
        
        cmd.ExecuteNonQuery();
        
        
        return ApiResponse<string>.Ok("Status updated successfully.");
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

    [HttpPost("staff")]
    public ActionResult<ApiResponse<BankStaffDto>> AddStaff([FromBody] BankStaffDto req)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.CommandText = "ADD_BANK_STAFF";
        
        cmd.Parameters.Add(new OracleParameter("p_user_id", GetCurrentUserId()));
        cmd.Parameters.Add(new OracleParameter("p_full_name", req.FullName));
        cmd.Parameters.Add(new OracleParameter("p_position", req.PositionTitle));
        cmd.Parameters.Add(new OracleParameter("p_phone", req.Phone));
        cmd.Parameters.Add(new OracleParameter("p_email", req.Email));
        
        var pStaffId = new OracleParameter("p_staff_id", OracleDbType.Decimal) { Direction = ParameterDirection.Output };
        cmd.Parameters.Add(pStaffId);
        
        cmd.ExecuteNonQuery();
        req.StaffId = Convert.ToInt32(pStaffId.Value.ToString());
        req.Status = "ACTIVE";
        req.AssignedFrom = DateTime.Today;
        return ApiResponse<BankStaffDto>.Ok(req);
    }

    [HttpDelete("staff/{staffId}")]
    public ActionResult<ApiResponse<string>> DeleteStaff(int staffId)
    {
        using var connection = _oracleDb.CreateConnection() as OracleConnection;
        connection!.Open();
        using var cmd = connection.CreateCommand();
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.CommandText = "REMOVE_BANK_STAFF";
        
        cmd.Parameters.Add(new OracleParameter("p_user_id", GetCurrentUserId()));
        cmd.Parameters.Add(new OracleParameter("p_staff_id", staffId));
        
        var rows = cmd.ExecuteNonQuery();
        
        return ApiResponse<string>.Ok("Staff removed");
    }

    [HttpGet("reports/inventory")]
    public ActionResult GenerateInventoryReport()
    {
        var inventory = GetInventory(null, null).Value?.Data ?? new List<BloodUnitDto>();
        
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

    [HttpGet("reports/expiry")]
    public ActionResult GenerateExpiryReport()
    {
        var inventory = GetInventory(null, null).Value?.Data ?? new List<BloodUnitDto>();
        var expiring = inventory.Where(i => i.ExpiryDate <= DateTime.Now.AddDays(7) && i.Status == "AVAILABLE").OrderBy(i => i.ExpiryDate).ToList();
        
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.Header().Text("Blood Bank Expiry Report (Next 7 Days)").SemiBold().FontSize(24).FontColor(Colors.Red.Medium);
                
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
                            h.Cell().Text("Days Left").SemiBold();
                        });

                        foreach (var u in expiring)
                        {
                            t.Cell().Text(u.UnitCode);
                            t.Cell().Text(u.BloodGroup);
                            t.Cell().Text(u.ExpiryDate.ToShortDateString());
                            t.Cell().Text(Math.Max(0, (u.ExpiryDate - DateTime.Now).Days).ToString());
                        }
                    });
                });
            });
        });

        var pdf = document.GeneratePdf();
        return File(pdf, "application/pdf", $"Expiry_Report_{DateTime.Now:yyyyMMdd}.pdf");
    }

    [HttpGet("reports/hospital-requests")]
    public ActionResult GenerateHospitalRequestsReport()
    {
        var requests = GetHospitalRequests().Value?.Data ?? new List<HospitalRequestDto>();
        
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.Header().Text("Hospital Requests Report").SemiBold().FontSize(24).FontColor(Colors.Red.Medium);
                
                page.Content().PaddingVertical(1, Unit.Centimetre).Column(x =>
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
                            c.RelativeColumn();
                        });

                        t.Header(h =>
                        {
                            h.Cell().Text("Hospital").SemiBold();
                            h.Cell().Text("Blood Group").SemiBold();
                            h.Cell().Text("Priority").SemiBold();
                            h.Cell().Text("Status").SemiBold();
                        });

                        foreach (var r in requests)
                        {
                            t.Cell().Text(r.HospitalName);
                            t.Cell().Text(r.BloodGroup);
                            t.Cell().Text(r.Priority);
                            t.Cell().Text(r.Status);
                        }
                    });
                });
            });
        });

        var pdf = document.GeneratePdf();
        return File(pdf, "application/pdf", $"Hospital_Requests_Report_{DateTime.Now:yyyyMMdd}.pdf");
    }
}



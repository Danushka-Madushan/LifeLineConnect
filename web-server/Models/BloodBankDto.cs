using System;

namespace web_server.Models
{
    public class BankDashboardDto
    {
        public int TotalUnits { get; set; }
        public int IncomingTransfers { get; set; }
        public int PendingRequests { get; set; }
        public int ExpiringSoon { get; set; }
    }

    public class BloodUnitDto
    {
        public int BloodUnitId { get; set; }
        public string UnitCode { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public DateTime CollectionDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string StorageLocation { get; set; } = string.Empty;
    }

    public class DonationTransferDto
    {
        public int TransferId { get; set; }
        public string TransferCode { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? DispatchedAt { get; set; }
        public DateTime? ReceivedAt { get; set; }
        public decimal? ReceivedUnitCount { get; set; }
        public string CampTitle { get; set; } = string.Empty;
        public string CommitteeName { get; set; } = string.Empty;
    }

    public class HospitalRequestDto
    {
        public int RequestId { get; set; }
        public string RequestCode { get; set; } = string.Empty;
        public string HospitalName { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public decimal UnitsRequired { get; set; }
        public decimal UnitsAllocated { get; set; }
        public decimal UnitsFulfilled { get; set; }
        public DateTime NeededBy { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class BankStaffDto
    {
        public int StaffId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PositionTitle { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime AssignedFrom { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}

namespace web_server.Models
{
    public class CommitteeDashboardDto
    {
        public int ActiveCamps { get; set; }
        public int PendingTransfers { get; set; }
        public int TotalRegistrations { get; set; }
        public int ActiveVenues { get; set; }
    }

    public class VenueDto
    {
        public int VenueId { get; set; }
        public string VenueName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CommitteeCampDto
    {
        public int CampId { get; set; }
        public string CampTitle { get; set; } = string.Empty;
        public DateTime CampDate { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int Capacity { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PublicVisible { get; set; } = string.Empty;
        public string VenueName { get; set; } = string.Empty;
    }

    public class CreateCampDto
    {
        public int VenueId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int Capacity { get; set; }
    }

    public class CampAttendanceDto
    {
        public int RegistrationId { get; set; }
        public int DonorId { get; set; }
        public string RegistrationStatus { get; set; } = string.Empty;
        public string AttendanceStatus { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Nic { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public bool HasDonated { get; set; }
    }

    public class RecordDonationDto
    {
        public int RegistrationId { get; set; }
        public int DonorId { get; set; }
        public string BloodGroup { get; set; } = string.Empty;
        public decimal Units { get; set; } = 1;
    }

    public class DispatchTransferDto
    {
        public int BloodBankId { get; set; }
    }
}

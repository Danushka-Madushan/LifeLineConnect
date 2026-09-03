using System;

namespace web_server.Models
{
    public class DonorProfileDto
    {
        public int DonorId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Nic { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class DonorProfileUpdateDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
    }

    public class DonorDashboardDto
    {
        public int TotalDonations { get; set; }
        public int UpcomingCamps { get; set; }
        public DateTime? LastDonationDate { get; set; }
        public bool IsEligible { get; set; }
        public string EligibilityReason { get; set; } = string.Empty;
        public DateTime NextEligibleDate { get; set; }
    }

    public class CampRegistrationRequestDto
    {
        public int CampId { get; set; }
    }

    public class DonorDonationDto
    {
        public int DonationId { get; set; }
        public DateTime DonationDate { get; set; }
        public string BloodGroup { get; set; } = string.Empty;
        public decimal UnitsCollected { get; set; }
        public string Status { get; set; } = string.Empty;
        public int CampId { get; set; }
        public string CampTitle { get; set; } = string.Empty;
        public string VenueName { get; set; } = string.Empty;
    }

    public class FeedbackDto
    {
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
    }

    public class EmergencyAppealSubmitDto
    {
        public string PatientReference { get; set; } = string.Empty;
        public string Relationship { get; set; } = string.Empty;
        public string BloodGroup { get; set; } = string.Empty;
        public int UnitsRequired { get; set; }
        public string Urgency { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime NeededBy { get; set; }
        public string Summary { get; set; } = string.Empty;
    }
}

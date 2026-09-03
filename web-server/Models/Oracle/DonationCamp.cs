using System;

namespace web_server.Models.Oracle;

public class DonationCamp
{
    public int CampId { get; set; }
    public int CommitteeId { get; set; }
    public int VenueId { get; set; }
    public string CampTitle { get; set; } = string.Empty;
    public string CampDescription { get; set; } = string.Empty;
    public DateTime CampDate { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int Capacity { get; set; }
    public string Status { get; set; } = string.Empty;
    public string PublicVisible { get; set; } = "N";
}

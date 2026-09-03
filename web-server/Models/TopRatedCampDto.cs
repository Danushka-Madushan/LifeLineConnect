using web_server.Models.Oracle;

namespace web_server.Models
{
    public class TopRatedCampDto
    {
        public DonationCamp Camp { get; set; } = new();
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }
}

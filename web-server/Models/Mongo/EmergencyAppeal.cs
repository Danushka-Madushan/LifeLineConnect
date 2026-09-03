using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace web_server.Models.Mongo;

public class EmergencyAppeal
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("patientName")]
    public string PatientName { get; set; } = string.Empty;

    [BsonElement("bloodGroup")]
    public string BloodGroup { get; set; } = string.Empty;

    [BsonElement("unitsRequired")]
    public int UnitsRequired { get; set; }

    [BsonElement("hospitalName")]
    public string HospitalName { get; set; } = string.Empty;

    [BsonElement("location")]
    public string Location { get; set; } = string.Empty;

    [BsonElement("urgencyLevel")]
    public string UrgencyLevel { get; set; } = "HIGH";

    [BsonElement("contactPhone")]
    public string ContactPhone { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = "ACTIVE";

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }
}

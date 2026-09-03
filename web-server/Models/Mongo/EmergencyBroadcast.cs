using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace web_server.Models.Mongo;

public class EmergencyBroadcast
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("message")]
    public string Message { get; set; } = string.Empty;

    [BsonElement("severity")]
    public string Severity { get; set; } = "INFO";

    [BsonElement("isActive")]
    public bool IsActive { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("expiresAt")]
    public DateTime? ExpiresAt { get; set; }
}

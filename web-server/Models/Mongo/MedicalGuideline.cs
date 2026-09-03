using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace web_server.Models.Mongo;

public class MedicalGuideline
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("content")]
    public string Content { get; set; } = string.Empty;

    [BsonElement("category")]
    public string Category { get; set; } = string.Empty;

    [BsonElement("lastUpdated")]
    public DateTime LastUpdated { get; set; }
}

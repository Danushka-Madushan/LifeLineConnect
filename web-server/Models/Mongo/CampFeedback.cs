using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace web_server.Models.Mongo;

public class CampFeedback
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("campId")]
    public int CampId { get; set; }

    [BsonElement("donorId")]
    public int DonorId { get; set; }

    [BsonElement("rating")]
    public int Rating { get; set; } // 1 to 5

    [BsonElement("comments")]
    public string Comments { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }
}

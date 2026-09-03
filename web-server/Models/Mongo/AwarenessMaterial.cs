using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace web_server.Models.Mongo;

public class AwarenessMaterial
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("mediaType")]
    public string MediaType { get; set; } = "image"; // image, document

    [BsonElement("url")]
    public string Url { get; set; } = string.Empty;

    [BsonElement("published")]
    public bool Published { get; set; }

    [BsonElement("campId")]
    public int? CampId { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }
}

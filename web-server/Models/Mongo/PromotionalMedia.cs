using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace web_server.Models.Mongo;

public class PromotionalMedia
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("title")]
    public string Title { get; set; } = string.Empty;

    [BsonElement("bannerUrl")]
    public string BannerUrl { get; set; } = string.Empty;

    [BsonElement("targetLink")]
    public string TargetLink { get; set; } = string.Empty;

    [BsonElement("isActive")]
    public bool IsActive { get; set; }

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }
}

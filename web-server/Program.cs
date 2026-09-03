using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using web_server.Data;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load();
builder.Configuration["ConnectionStrings:OracleDb"] = Environment.GetEnvironmentVariable("ORACLE_DB_CONN") ?? builder.Configuration["ConnectionStrings:OracleDb"];
builder.Configuration["ConnectionStrings:MongoDb"] = Environment.GetEnvironmentVariable("MONGO_DB_CONN") ?? builder.Configuration["ConnectionStrings:MongoDb"];
builder.Configuration["ConnectionStrings:MongoDbDatabaseName"] = Environment.GetEnvironmentVariable("MONGO_DB_NAME") ?? builder.Configuration["ConnectionStrings:MongoDbDatabaseName"];
builder.Configuration["JwtSettings:Secret"] = Environment.GetEnvironmentVariable("JWT_SECRET") ?? builder.Configuration["JwtSettings:Secret"];


// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Database Contexts
builder.Services.AddSingleton<OracleDbContext>();
builder.Services.AddSingleton<MongoDbContext>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVite",
        b => b.WithOrigins("http://localhost:5173", "http://localhost:4173")
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
        };
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseCors("AllowVite");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

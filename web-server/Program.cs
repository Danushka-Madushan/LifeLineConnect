var builder = WebApplication.CreateBuilder(args);

// 1. Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVite", policy =>
    {
        // Replace with your actual Vite local URL if different
        policy.WithOrigins("http://localhost:5173") 
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// 2. Enable CORS middleware
// IMPORTANT: This must be called before MapGet, MapControllers, or UseAuthorization
app.UseCors("AllowVite");

// 3. Create a test endpoint
app.MapGet("/api/status", () => 
{
    return Results.Ok(new { message = "Backend is successfully connected to Vite!" });
});

app.Run();

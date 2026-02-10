using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Sabq.Api.Hubs;
using Sabq.Application.Interfaces;
using Sabq.Application.Services;
using Sabq.Infrastructure.Data;
using Sabq.Infrastructure.RoomState;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Sabq API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<SabqDbContext>(options =>
    options.UseSqlServer(connectionString));

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "SabqSecretKey_ThisIsAVeryLongSecretKeyForJwtTokenGeneration_MinimumLength256Bits_PleaseChangeInProduction";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SabqApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SabqClients";

builder.Services.AddSingleton<ITokenService>(sp =>
    new JwtTokenService(jwtSecret, jwtIssuer, jwtAudience));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // For SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

// Room Store (Use Redis if configured, otherwise InMemory)
var redisConnection = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConnection))
{
    var redis = StackExchange.Redis.ConnectionMultiplexer.Connect(redisConnection);
    builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(redis);
    builder.Services.AddSingleton<IRoomStore, RedisRoomStore>();
}
else
{
    builder.Services.AddSingleton<IRoomStore, InMemoryRoomStore>();
}

// Application Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<RoomService>();
builder.Services.AddScoped<GameService>();
builder.Services.AddScoped<CategoryService>();

// SignalR
builder.Services.AddSignalR();

// CORS for web client
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowWebClient", policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200",
            "http://localhost:4201",
            "http://localhost:4202"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SabqDbContext>();
    await context.Database.MigrateAsync();
    await DbSeeder.SeedAsync(context);
}

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowWebClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<SabqHub>("/hubs/sabq");

app.Run();

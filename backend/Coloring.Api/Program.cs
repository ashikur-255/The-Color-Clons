using System.Text;

using Coloring.Application;
using Coloring.Infrastructure;
using Coloring.Infrastructure.Data.Seed;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// JWT SETTINGS
// ============================================================

var jwtSettings =
    builder.Configuration.GetSection("Jwt");

var jwtKey =
    jwtSettings["Key"]
    ?? throw new InvalidOperationException(
        "JWT Key is not configured.");

var jwtIssuer =
    jwtSettings["Issuer"]
    ?? throw new InvalidOperationException(
        "JWT Issuer is not configured.");

var jwtAudience =
    jwtSettings["Audience"]
    ?? throw new InvalidOperationException(
        "JWT Audience is not configured.");


// ============================================================
// SERVICES
// ============================================================

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();


// ============================================================
// CORS
// IMPORTANT:
// CORS MUST be available before StaticFiles
// because SVG/image files are served by StaticFiles middleware.
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});


// ============================================================
// SWAGGER
// ============================================================

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "TheColorClone API",
            Version = "v1"
        });

    // --------------------------------------------------------
    // JWT Bearer Authentication
    // --------------------------------------------------------

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",

            In = ParameterLocation.Header,

            Type = SecuritySchemeType.Http,

            Scheme = "bearer",

            BearerFormat = "JWT",

            Description =
                "JWT Authorization header using the Bearer scheme."
        });

    // --------------------------------------------------------
    // Apply JWT Security
    // --------------------------------------------------------

    options.AddSecurityRequirement(
        document =>
            new OpenApiSecurityRequirement
            {
                [
                    new OpenApiSecuritySchemeReference(
                        "Bearer",
                        document)
                ] = []
            });
});


// ============================================================
// APPLICATION LAYER
// ============================================================

builder.Services.AddApplication();


// ============================================================
// INFRASTRUCTURE LAYER
// ============================================================
//
// This should configure:
// - SQL Server
// - EF Core
// - ASP.NET Core Identity
// - UserManager<ApplicationUser>
// - RoleManager<IdentityRole<int>>
// - Repositories
// - Application services
//
// ============================================================

builder.Services.AddInfrastructure(
    builder.Configuration);


// ============================================================
// JWT AUTHENTICATION
// ============================================================

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,

                ValidateAudience = true,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    jwtIssuer,

                ValidAudience =
                    jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtKey)),

                ClockSkew =
                    TimeSpan.Zero
            };
    });


// ============================================================
// AUTHORIZATION
// ============================================================
//
// Required for:
// [Authorize]
// [Authorize(Roles = "Admin")]
//
// ============================================================

builder.Services.AddAuthorization();


// ============================================================
// BUILD APPLICATION
// ============================================================

var app = builder.Build();


// ============================================================
// SEED ADMIN USER + ADMIN ROLE
// ============================================================

using (var scope = app.Services.CreateScope())
{
    await AdminSeeder.SeedAsync(
        scope.ServiceProvider);
}


// ============================================================
// SWAGGER
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}


// ============================================================
// CORS
// IMPORTANT:
// MUST COME BEFORE STATIC FILES
// ============================================================

app.UseCors("Frontend");


// ============================================================
// STATIC FILES
//
// This serves:
//
// /uploads/svg/xxxxx.svg
// /uploads/images/xxxxx.png
// /uploads/thumbnails/xxxxx.png
//
// from:
//
// wwwroot/uploads/
// ============================================================

app.UseStaticFiles();


// ============================================================
// HTTPS
// ============================================================

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}


// ============================================================
// AUTHENTICATION
// ============================================================

app.UseAuthentication();


// ============================================================
// AUTHORIZATION
// ============================================================

app.UseAuthorization();


// ============================================================
// CONTROLLERS
// ============================================================

app.MapControllers();


// ============================================================
// RUN
// ============================================================
app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        name = "TheColorClone API",
        status = "Running",
        version = "1.0.0",
        environment = "Development",
        api = "http://localhost:5100",
        swagger = "http://localhost:5100/swagger"
    });
});

app.Run();
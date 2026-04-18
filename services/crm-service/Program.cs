// =============================================================================
// Program.cs - CRM Service (.NET 8)
// Configure l'authentification JWT en mode STATELESS
// Lit la clé publique RSA depuis le volume partagé (/app/keys/public.pem)
// Si la clé n'est pas disponible, l'auth est désactivée (mode dev)
// =============================================================================

using System.Security.Cryptography;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using CrmService.Data;
using CrmService.Interfaces;
using CrmService.Repositories;
using CrmService.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// --- Charger la clé publique RSA depuis le fichier PEM partagé ---
var publicKeyPath = "/app/keys/public.pem";

// Attendre que la clé soit disponible (le conteneur Auth peut démarrer après)
var maxRetries = 10;
var keyLoaded = false;

for (int i = 0; i < maxRetries; i++)
{
    if (File.Exists(publicKeyPath))
    {
        keyLoaded = true;
        break;
    }
    Console.WriteLine($"En attente de la clé publique... tentative {i + 1}/{maxRetries}");
    Thread.Sleep(2000);
}

if (keyLoaded)
{
    // --- Mode normal : JWT activé avec clé RSA ---
    RSA rsa = RSA.Create();
    var publicKeyPem = File.ReadAllText(publicKeyPath);
    rsa.ImportFromPem(publicKeyPem.ToCharArray());
    var rsaSecurityKey = new RsaSecurityKey(rsa);

    Console.WriteLine("✅ Clé publique chargée — Authentification JWT activée.");

    builder.Services
        .AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = rsaSecurityKey,
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };
        });

    builder.Services.AddAuthorization();
}
else
{
    // --- Mode dégradé : JWT désactivé (clé introuvable) ---
    Console.WriteLine("⚠️  Clé publique introuvable — Authentification désactivée (mode dev).");

    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer();

    builder.Services.AddAuthorization(options =>
    {
        options.DefaultPolicy = new AuthorizationPolicyBuilder()
            .RequireAssertion(_ => true)
            .Build();
    });
}

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

// --- Entity Framework Core + PostgreSQL ---
builder.Services.AddDbContext<CrmDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- Injection de dépendances : Repositories (SOLID - Dependency Inversion) ---
builder.Services.AddScoped<ILeadRepository, LeadRepository>();
builder.Services.AddScoped<ICampagneRepository, CampagneRepository>();
builder.Services.AddScoped<IOpportuniteRepository, OpportuniteRepository>();

// --- Injection de dépendances : Services (Règles métier) ---
builder.Services.AddScoped<ILeadService, LeadService>();
builder.Services.AddScoped<ICampagneService, CampagneService>();
builder.Services.AddScoped<IOpportuniteService, OpportuniteService>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ITicketRepository, TicketRepository>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IInteractionRepository, InteractionRepository>();
builder.Services.AddScoped<IInteractionService, InteractionService>();

// --- OpenAPI + Scalar pour tester les API ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- Appliquer les migrations automatiquement au démarrage ---
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CrmDbContext>();
    dbContext.Database.Migrate();
}

// --- Pipeline HTTP ---
app.UseSwagger();
app.UseSwaggerUI();

// --- Scalar : UI moderne pour tester les API (accessible sur /scalar/v1) ---
app.MapScalarApiReference(options =>
{
    options
        .WithTitle("CRM Service API")
        .WithTheme(ScalarTheme.DeepSpace)
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
});

// L'ordre est IMPORTANT : Authentication avant Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

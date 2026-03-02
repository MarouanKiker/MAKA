// =============================================================================
// Program.cs - CRM Service (.NET 8)
// Configure l'authentification JWT en mode STATELESS
// Lit la clé publique RSA depuis le volume partagé (/app/keys/public.pem)
// =============================================================================

using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// --- Charger la clé publique RSA depuis le fichier PEM partagé ---
// Cette clé est générée par le service Auth (Symfony) et partagée
// via un volume Docker. Le CRM n'a JAMAIS besoin d'appeler le service Auth.
var publicKeyPath = "/app/keys/public.pem";

RSA rsa = RSA.Create();

// Attendre que la clé soit disponible (le conteneur Auth peut démarrer après)
var maxRetries = 30;
for (int i = 0; i < maxRetries; i++)
{
    if (File.Exists(publicKeyPath))
        break;
    Console.WriteLine($"En attente de la clé publique... tentative {i + 1}/{maxRetries}");
    Thread.Sleep(2000);  // Attendre 2 secondes entre chaque tentative
}

if (!File.Exists(publicKeyPath))
{
    throw new FileNotFoundException(
        $"Clé publique introuvable à '{publicKeyPath}'. " +
        "Vérifiez que le service Auth a démarré et généré les clés.");
}

// Lire le contenu PEM et importer la clé publique RSA
var publicKeyPem = File.ReadAllText(publicKeyPath);
rsa.ImportFromPem(publicKeyPem.ToCharArray());

// Créer la SecurityKey à partir de la clé RSA
var rsaSecurityKey = new RsaSecurityKey(rsa);

// --- Configurer l'authentification JWT Bearer ---
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
            // Valider la signature avec la clé publique RSA
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = rsaSecurityKey,

            // En dev, on désactive la validation issuer/audience
            // En PRODUCTION, il faudra les configurer !
            ValidateIssuer = false,
            ValidateAudience = false,

            // Valider l'expiration du token
            ValidateLifetime = true,

            // Tolérance d'horloge entre conteneurs (évite les rejets pour
            // quelques secondes de décalage)
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// --- Swagger pour le dev ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- Pipeline HTTP ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// L'ordre est IMPORTANT : Authentication avant Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

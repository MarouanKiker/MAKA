// =============================================================================
// CrmController - Contrôleur protégé par JWT
// Toutes les routes nécessitent un token valide (émis par le service Auth)
// =============================================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CrmService.Controllers;

[ApiController]
[Route("api/crm")]
[Authorize]  // <-- Toutes les routes de ce contrôleur exigent un JWT valide
public class CrmController : ControllerBase
{
    // -------------------------------------------------------------------------
    // GET /api/crm/clients
    // Retourne une liste fictive de clients (pour tester l'accès)
    // -------------------------------------------------------------------------
    [HttpGet("clients")]
    public IActionResult GetClients()
    {
        // Récupérer l'email de l'utilisateur depuis les claims du JWT
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value
                     ?? User.FindFirst("email")?.Value
                     ?? "unknown";

        // Données fictives pour la démonstration
        var clients = new[]
        {
            new { Id = 1, Name = "Acme Corp", Contact = "john@acme.com" },
            new { Id = 2, Name = "Globex Inc", Contact = "jane@globex.com" },
            new { Id = 3, Name = "Initech", Contact = "bill@initech.com" }
        };

        return Ok(new
        {
            message = "Accès autorisé au CRM",
            authenticatedUser = userEmail,
            data = clients
        });
    }

    // -------------------------------------------------------------------------
    // GET /api/crm/me
    // Retourne les informations de l'utilisateur connecté (extraites du JWT)
    // -------------------------------------------------------------------------
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        // Lister tous les claims du token pour le debug
        var claims = User.Claims.Select(c => new
        {
            type = c.Type,
            value = c.Value
        });

        return Ok(new
        {
            message = "Informations extraites du token JWT",
            claims = claims
        });
    }
}

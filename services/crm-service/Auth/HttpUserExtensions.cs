using System.Security.Claims;

namespace CrmService.Auth;

/// <summary>
/// ID utilisateur Auth (Symfony JWT claim <c>user_id</c>).
/// </summary>
public static class HttpUserExtensions
{
    public static int? GetAuthUserId(this ClaimsPrincipal user)
    {
        var v = user.FindFirst("user_id")?.Value
                ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(v, out var id) ? id : null;
    }
}

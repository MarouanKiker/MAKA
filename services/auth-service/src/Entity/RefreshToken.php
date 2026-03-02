<?php
// =============================================================================
// Entity RefreshToken - Token de rafraîchissement JWT
// Lié à un User, avec expiration et rotation automatique
// =============================================================================

namespace App\Entity;

use App\Repository\RefreshTokenRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RefreshTokenRepository::class)]
#[ORM\Table(name: 'refresh_token')]
class RefreshToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(type: 'string', length: 64, unique: true)]
    private string $token;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    // -------------------------------------------------------------------------
    // Constructeur
    // -------------------------------------------------------------------------

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    /**
     * Crée un nouveau refresh token pour un utilisateur donné.
     * Durée de vie par défaut : 30 jours.
     */
    public static function create(User $user, int $ttlDays = 30): self
    {
        $refreshToken = new self();
        $refreshToken->user = $user;
        $refreshToken->token = bin2hex(random_bytes(32)); // 64 chars hex
        $refreshToken->expiresAt = new \DateTimeImmutable("+{$ttlDays} days");
        return $refreshToken;
    }

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getToken(): string
    {
        return $this->token;
    }

    public function getExpiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * Vérifie si le refresh token est expiré.
     */
    public function isExpired(): bool
    {
        return $this->expiresAt <= new \DateTimeImmutable();
    }
}

<?php
// =============================================================================
// Entity User - Entité Doctrine pour l'authentification
// Champs : email, password, roles, resetToken, resetTokenExpiresAt, createdAt
// =============================================================================

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 180, unique: true)]
    private ?string $email = null;

    #[ORM\Column(type: 'string', length: 100)]
    private ?string $firstName = null;

    #[ORM\Column(type: 'string', length: 100)]
    private ?string $lastName = null;

    /**
     * @var list<string> Les rôles de l'utilisateur
     */
    #[ORM\Column(type: 'json')]
    private array $roles = [];

    /**
     * @var string Le mot de passe hashé
     */
    #[ORM\Column(type: 'string')]
    private ?string $password = null;

    // -------------------------------------------------------------------------
    // Champs pour la réinitialisation du mot de passe
    // -------------------------------------------------------------------------

    #[ORM\Column(type: 'string', length: 64, nullable: true)]
    private ?string $resetToken = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $resetTokenExpiresAt = null;

    // -------------------------------------------------------------------------
    // Métadonnées
    // -------------------------------------------------------------------------

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    // -------------------------------------------------------------------------
    // Constructeur
    // -------------------------------------------------------------------------

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    // -------------------------------------------------------------------------
    // Getters & Setters - Champs de base
    // -------------------------------------------------------------------------

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    /**
     * Identifiant unique de l'utilisateur (utilisé par Symfony Security)
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getFirstName(): ?string
    {
        return $this->firstName;
    }

    public function setFirstName(string $firstName): static
    {
        $this->firstName = $firstName;
        return $this;
    }

    public function getLastName(): ?string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): static
    {
        $this->lastName = $lastName;
        return $this;
    }

    /**
     * @return list<string>
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';
        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;
        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    /**
     * Nettoyer les données sensibles temporaires
     */
    public function eraseCredentials(): void
    {
        // $this->plainPassword = null;
    }

    // -------------------------------------------------------------------------
    // Getters & Setters - Reset Token
    // -------------------------------------------------------------------------

    public function getResetToken(): ?string
    {
        return $this->resetToken;
    }

    public function setResetToken(?string $resetToken): static
    {
        $this->resetToken = $resetToken;
        return $this;
    }

    public function getResetTokenExpiresAt(): ?\DateTimeImmutable
    {
        return $this->resetTokenExpiresAt;
    }

    public function setResetTokenExpiresAt(?\DateTimeImmutable $resetTokenExpiresAt): static
    {
        $this->resetTokenExpiresAt = $resetTokenExpiresAt;
        return $this;
    }

    /**
     * Génère un token crypto-sécurisé pour la réinitialisation du mot de passe.
     * Expire dans 1 heure par défaut.
     */
    public function generateResetToken(int $ttlMinutes = 60): string
    {
        $this->resetToken = bin2hex(random_bytes(32)); // 64 caractères hex
        $this->resetTokenExpiresAt = new \DateTimeImmutable("+{$ttlMinutes} minutes");
        return $this->resetToken;
    }

    /**
     * Vérifie si le token de reset est toujours valide (non expiré).
     */
    public function isResetTokenValid(): bool
    {
        if ($this->resetToken === null || $this->resetTokenExpiresAt === null) {
            return false;
        }
        return $this->resetTokenExpiresAt > new \DateTimeImmutable();
    }

    /**
     * Nettoie le token de reset après utilisation.
     */
    public function clearResetToken(): void
    {
        $this->resetToken = null;
        $this->resetTokenExpiresAt = null;
    }

    // -------------------------------------------------------------------------
    // Getters & Setters - Métadonnées
    // -------------------------------------------------------------------------

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }
}
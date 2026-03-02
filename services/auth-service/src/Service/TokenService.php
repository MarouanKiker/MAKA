<?php
// =============================================================================
// TokenService — Logique métier des refresh tokens
// Refresh (rotation) et revoke
// =============================================================================

namespace App\Service;

use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

class TokenService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private RefreshTokenRepository $refreshTokenRepository,
        private JWTTokenManagerInterface $jwtManager,
    ) {}

    // =========================================================================
    // Refresh — Rotation du JWT + refresh token
    // =========================================================================

    /**
     * Échange un refresh token valide contre un nouveau JWT + refresh token.
     *
     * @return array{token: string, refresh_token: string, expires_in: int}
     * @throws \InvalidArgumentException si le refresh token est invalide
     */
    public function refresh(string $refreshTokenValue): array
    {
        $refreshToken = $this->refreshTokenRepository->findValidToken($refreshTokenValue);

        if (!$refreshToken) {
            throw new \InvalidArgumentException('Refresh token invalide ou expiré.');
        }

        $user = $refreshToken->getUser();

        // Rotation : supprimer l'ancien, créer un nouveau
        $this->entityManager->remove($refreshToken);

        $newRefreshToken = RefreshToken::create($user);
        $this->entityManager->persist($newRefreshToken);
        $this->entityManager->flush();

        // Générer un nouveau JWT
        $jwt = $this->jwtManager->create($user);

        return [
            'token' => $jwt,
            'refresh_token' => $newRefreshToken->getToken(),
            'expires_in' => 3600,
        ];
    }

    // =========================================================================
    // Revoke — Révoquer un refresh token
    // =========================================================================

    public function revoke(string $refreshTokenValue): void
    {
        $refreshToken = $this->refreshTokenRepository->findOneBy([
            'token' => $refreshTokenValue,
        ]);

        if ($refreshToken) {
            $this->entityManager->remove($refreshToken);
            $this->entityManager->flush();
        }
    }

    // =========================================================================
    // Create — Créer un nouveau refresh token pour un utilisateur
    // =========================================================================

    public function createRefreshToken(User $user): RefreshToken
    {
        $refreshToken = RefreshToken::create($user);
        $this->entityManager->persist($refreshToken);
        $this->entityManager->flush();

        return $refreshToken;
    }

    // =========================================================================
    // Cleanup — Supprimer les tokens expirés
    // =========================================================================

    public function cleanupExpiredTokens(): int
    {
        return $this->refreshTokenRepository->deleteExpiredTokens();
    }
}

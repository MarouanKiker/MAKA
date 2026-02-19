<?php

namespace App\Service;

use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

class JwtService
{
    public function __construct(
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly RefreshTokenRepository $refreshTokenRepository,
    ) {}

    public function generateToken(User $user): string
    {
        return $this->jwtManager->create($user);
    }

    public function validateToken(string $token): ?array
    {
        try {
            return $this->jwtManager->parse($token);
        } catch (\Exception) {
            return null;
        }
    }

    public function generateRefreshToken(User $user): string
    {
        $rawToken = bin2hex(random_bytes(64));

        $refreshToken = new RefreshToken();
        $refreshToken->setToken($rawToken);
        $refreshToken->setUser($user);
        $refreshToken->setExpiresAt(new \DateTimeImmutable('+30 days'));
        $refreshToken->setRevoked(false);

        $this->refreshTokenRepository->save($refreshToken, true);

        return $rawToken;
    }
}

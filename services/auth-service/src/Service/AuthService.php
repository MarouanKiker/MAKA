<?php

namespace App\Service;

use App\DTO\RegisterRequest;
use App\DTO\TokenResponse;
use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use App\Repository\UserRepository;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly RefreshTokenRepository $refreshTokenRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly JwtService $jwtService,
    ) {}

    public function login(string $email, string $password): TokenResponse
    {
        $user = $this->userRepository->findByEmail($email);

        if (!$user || !$this->passwordHasher->isPasswordValid($user, $password)) {
            throw new \InvalidArgumentException('Invalid credentials.');
        }

        if (!$user->isActive()) {
            throw new \InvalidArgumentException('Account is disabled.');
        }

        $user->setLastLoginAt(new \DateTimeImmutable());
        $this->userRepository->save($user, true);

        $accessToken  = $this->jwtService->generateToken($user);
        $refreshToken = $this->jwtService->generateRefreshToken($user);

        return new TokenResponse($accessToken, $refreshToken, 3600, 'Bearer');
    }

    public function register(RegisterRequest $dto): User
    {
        if ($this->userRepository->findByEmail($dto->email)) {
            throw new \RuntimeException('A user with this email already exists.');
        }

        $user = new User();
        $user->setNom($dto->nom);
        $user->setPrenom($dto->prenom);
        $user->setEmail($dto->email);
        $user->setRoles($dto->roles ?: ['ROLE_EMPLOYE']);

        $hashedPassword = $this->passwordHasher->hashPassword($user, $dto->password);
        $user->setPassword($hashedPassword);

        $this->userRepository->save($user, true);

        return $user;
    }

    public function refreshToken(string $rawToken): TokenResponse
    {
        $refreshToken = $this->refreshTokenRepository->findValidToken($rawToken);

        if (!$refreshToken) {
            throw new \InvalidArgumentException('Invalid or expired refresh token.');
        }

        $user = $refreshToken->getUser();

        // Revoke old token
        $refreshToken->setRevoked(true);
        $this->refreshTokenRepository->save($refreshToken, true);

        $accessToken     = $this->jwtService->generateToken($user);
        $newRefreshToken = $this->jwtService->generateRefreshToken($user);

        return new TokenResponse($accessToken, $newRefreshToken, 3600, 'Bearer');
    }

    public function logout(string $rawToken): void
    {
        $refreshToken = $this->refreshTokenRepository->findValidToken($rawToken);

        if ($refreshToken) {
            $refreshToken->setRevoked(true);
            $this->refreshTokenRepository->save($refreshToken, true);
        }
    }
}

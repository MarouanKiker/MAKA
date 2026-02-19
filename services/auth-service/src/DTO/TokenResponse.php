<?php

namespace App\DTO;

class TokenResponse
{
    public function __construct(
        public readonly string $accessToken,
        public readonly string $refreshToken,
        public readonly int $expiresIn,
        public readonly string $tokenType = 'Bearer',
    ) {}
}

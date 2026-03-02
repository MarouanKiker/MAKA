<?php
// =============================================================================
// RefreshTokenDTO — Données pour le refresh/revoke de token
// =============================================================================

namespace App\DTO;

class RefreshTokenDTO
{
    public function __construct(
        public readonly string $refreshToken,
    ) {}

    /**
     * @throws \InvalidArgumentException
     */
    public static function fromArray(array $data): self
    {
        if (empty($data['refresh_token'])) {
            throw new \InvalidArgumentException('Le champ "refresh_token" est requis.');
        }

        return new self(refreshToken: $data['refresh_token']);
    }
}

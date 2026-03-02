<?php
// =============================================================================
// ResetPasswordDTO — Données pour la réinitialisation du mot de passe
// =============================================================================

namespace App\DTO;

class ResetPasswordDTO
{
    public function __construct(
        public readonly string $token,
        public readonly string $newPassword,
    ) {}

    /**
     * @throws \InvalidArgumentException
     */
    public static function fromArray(array $data): self
    {
        if (empty($data['token']) || empty($data['new_password'])) {
            throw new \InvalidArgumentException('Les champs "token" et "new_password" sont requis.');
        }

        if (strlen($data['new_password']) < 8) {
            throw new \InvalidArgumentException('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        }

        return new self(
            token: $data['token'],
            newPassword: $data['new_password'],
        );
    }
}

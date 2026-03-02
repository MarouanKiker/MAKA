<?php
// =============================================================================
// ChangePasswordDTO — Données pour le changement de mot de passe
// =============================================================================

namespace App\DTO;

class ChangePasswordDTO
{
    public function __construct(
        public readonly string $oldPassword,
        public readonly string $newPassword,
    ) {}

    /**
     * @throws \InvalidArgumentException
     */
    public static function fromArray(array $data): self
    {
        if (empty($data['old_password']) || empty($data['new_password'])) {
            throw new \InvalidArgumentException('Les champs "old_password" et "new_password" sont requis.');
        }

        if (strlen($data['new_password']) < 8) {
            throw new \InvalidArgumentException('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        }

        return new self(
            oldPassword: $data['old_password'],
            newPassword: $data['new_password'],
        );
    }
}

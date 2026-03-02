<?php
// =============================================================================
// ForgotPasswordDTO — Données pour la demande de réinitialisation
// =============================================================================

namespace App\DTO;

class ForgotPasswordDTO
{
    public function __construct(
        public readonly string $email,
    ) {}

    /**
     * @throws \InvalidArgumentException
     */
    public static function fromArray(array $data): self
    {
        if (empty($data['email'])) {
            throw new \InvalidArgumentException('Le champ "email" est requis.');
        }

        return new self(email: $data['email']);
    }
}

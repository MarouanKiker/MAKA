<?php
// =============================================================================
// RegisterDTO — Données de création d'un utilisateur
// =============================================================================

namespace App\DTO;

class RegisterDTO
{
    public function __construct(
        public readonly string $email,
        public readonly string $password,
        public readonly string $firstName,
        public readonly string $lastName,
    ) {}

    /**
     * Créer un DTO depuis les données JSON de la requête.
     * @throws \InvalidArgumentException si les données sont invalides
     */
    public static function fromArray(array $data): self
    {
        if (empty($data['email']) || empty($data['password']) || empty($data['first_name']) || empty($data['last_name'])) {
            throw new \InvalidArgumentException('Les champs "email", "password", "first_name" et "last_name" sont requis.');
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Format d\'email invalide.');
        }

        if (strlen($data['password']) < 8) {
            throw new \InvalidArgumentException('Le mot de passe doit contenir au moins 8 caractères.');
        }

        return new self(
            email: $data['email'],
            password: $data['password'],
            firstName: $data['first_name'],
            lastName: $data['last_name'],
        );
    }
}

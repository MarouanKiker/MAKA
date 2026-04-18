<?php
// =============================================================================
// AuthService — Logique métier d'authentification
// Register, change password, forgot/reset password
// =============================================================================

namespace App\Service;

use App\DTO\ChangePasswordDTO;
use App\DTO\ForgotPasswordDTO;
use App\DTO\RegisterDTO;
use App\DTO\ResetPasswordDTO;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private UserRepository $userRepository,
    ) {}

    // =========================================================================
    // Register — Créer un nouvel utilisateur
    // =========================================================================

    /**
     * @throws \InvalidArgumentException si l'email est déjà pris
     */
    public function register(RegisterDTO $dto): User
    {
        $existingUser = $this->userRepository->findOneBy(['email' => $dto->email]);
        if ($existingUser) {
            throw new \InvalidArgumentException('Un utilisateur avec cet email existe déjà.');
        }

        $user = new User();
        $user->setEmail($dto->email);
        $user->setFirstName($dto->firstName);
        $user->setLastName($dto->lastName);
        $user->setRoles(['ROLE_EMPLOYE']);

        $hashedPassword = $this->passwordHasher->hashPassword($user, $dto->password);
        $user->setPassword($hashedPassword);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }

    // =========================================================================
    // Change Password — Modifier le mot de passe (utilisateur authentifié)
    // =========================================================================

    /**
     * @throws \InvalidArgumentException si l'ancien mot de passe est incorrect
     */
    public function changePassword(User $user, ChangePasswordDTO $dto): void
    {
        if (!$this->passwordHasher->isPasswordValid($user, $dto->oldPassword)) {
            throw new \InvalidArgumentException('L\'ancien mot de passe est incorrect.');
        }

        $hashedPassword = $this->passwordHasher->hashPassword($user, $dto->newPassword);
        $user->setPassword($hashedPassword);
        $this->entityManager->flush();
    }

    // =========================================================================
    // Forgot Password — Générer un reset token
    // =========================================================================

    /**
     * Retourne le token si l'utilisateur existe, null sinon.
     */
    public function forgotPassword(ForgotPasswordDTO $dto): ?string
    {
        $user = $this->userRepository->findOneBy(['email' => $dto->email]);

        if (!$user) {
            return null; // Pas d'erreur pour des raisons de sécurité
        }

        $token = $user->generateResetToken(60); // Expire dans 1h
        $this->entityManager->flush();

        return $token;
    }

    // =========================================================================
    // Reset Password — Réinitialiser avec un token
    // =========================================================================

    /**
     * @throws \InvalidArgumentException si le token est invalide ou expiré
     */
    public function resetPassword(ResetPasswordDTO $dto): void
    {
        $user = $this->userRepository->findByResetToken($dto->token);

        if (!$user || !$user->isResetTokenValid()) {
            throw new \InvalidArgumentException('Token invalide ou expiré.');
        }

        $hashedPassword = $this->passwordHasher->hashPassword($user, $dto->newPassword);
        $user->setPassword($hashedPassword);
        $user->clearResetToken();
        $this->entityManager->flush();
    }

    // =========================================================================
    // Delete Account — Supprimer son propre compte
    // =========================================================================

    /**
     * @throws \InvalidArgumentException si le mot de passe est incorrect
     */
    public function deleteAccount(User $user, string $password): void
    {
        if (!$this->passwordHasher->isPasswordValid($user, $password)) {
            throw new \InvalidArgumentException('Mot de passe incorrect.');
        }

        $this->entityManager->remove($user);
        $this->entityManager->flush();
    }

    // =========================================================================
    // Helpers — Sérialisation d'un utilisateur
    // =========================================================================

    public function serializeUser(User $user, bool $includeTimestamp = false): array
    {
        $data = [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'first_name' => $user->getFirstName(),
            'last_name' => $user->getLastName(),
            'roles' => $user->getRoles(),
        ];

        if ($includeTimestamp) {
            $data['created_at'] = $user->getCreatedAt()->format('c');
        }

        return $data;
    }
}

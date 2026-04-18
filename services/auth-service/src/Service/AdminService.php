<?php
// =============================================================================
// AdminService — Logique métier d'administration des utilisateurs
// Promote, demote, delete user
// =============================================================================

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;

class AdminService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
    ) {}

    // =========================================================================
    // Find — Trouver un utilisateur par ID
    // =========================================================================

    /**
     * @throws \InvalidArgumentException si l'utilisateur n'existe pas
     */
    public function findUserOrFail(int $id): User
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            throw new \InvalidArgumentException('Utilisateur non trouvé.');
        }
        return $user;
    }

    // =========================================================================
    // Promote — Ajouter ROLE_ADMIN
    // =========================================================================

    /**
     * @throws \InvalidArgumentException si déjà admin
     */
    public function promote(User $targetUser): User
    {
        $roles = $targetUser->getRoles();
        if (in_array('ROLE_ADMIN', $roles)) {
            throw new \InvalidArgumentException('L\'utilisateur est déjà administrateur.');
        }

        $roles[] = 'ROLE_ADMIN';
        $targetUser->setRoles(array_values(array_unique($roles)));
        $this->entityManager->flush();

        return $targetUser;
    }

    // =========================================================================
    // Demote — Retirer ROLE_ADMIN
    // =========================================================================

    /**
     * @throws \InvalidArgumentException si l'admin essaye de se rétrograder
     */
    public function demote(User $targetUser, User $currentUser): User
    {
        if ($currentUser->getId() === $targetUser->getId()) {
            throw new \InvalidArgumentException('Vous ne pouvez pas vous rétrograder vous-même.');
        }

        $roles = array_filter($targetUser->getRoles(), fn($r) => $r !== 'ROLE_ADMIN');
        $targetUser->setRoles(array_values($roles));
        $this->entityManager->flush();

        return $targetUser;
    }

    // =========================================================================
    // Update Roles
    // =========================================================================
    public function updateRoles(User $targetUser, User $currentUser, array $roles): User
    {
        if ($currentUser->getId() === $targetUser->getId() && !in_array('ROLE_ADMIN', $roles)) {
            throw new \InvalidArgumentException('Vous ne pouvez pas retirer votre propre role ADMIN.');
        }

        if (empty($roles)) {
            $roles = ['ROLE_EMPLOYE'];
        }

        $targetUser->setRoles(array_values(array_unique($roles)));
        $this->entityManager->flush();

        return $targetUser;
    }

    // =========================================================================
    // Delete — Supprimer un utilisateur
    // =========================================================================

    /**
     * @throws \InvalidArgumentException si l'admin essaye de se supprimer
     */
    public function deleteUser(User $targetUser, User $currentUser): string
    {
        if ($currentUser->getId() === $targetUser->getId()) {
            throw new \InvalidArgumentException('Vous ne pouvez pas supprimer votre propre compte depuis l\'admin.');
        }

        $email = $targetUser->getEmail();
        $this->entityManager->remove($targetUser);
        $this->entityManager->flush();

        return $email;
    }

    // =========================================================================
    // List — Lister tous les utilisateurs
    // =========================================================================

    /**
     * @return User[]
     */
    public function getAllUsers(): array
    {
        return $this->userRepository->findAll();
    }
}

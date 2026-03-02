<?php
// =============================================================================
// AdminController — Endpoints d'administration (thin controller)
// Délègue la logique métier à AdminService et AuthService
// =============================================================================

namespace App\Controller;

use App\Entity\User;
use App\Service\AdminService;
use App\Service\AuthService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth/admin')]
class AdminController extends AbstractController
{
    public function __construct(
        private AdminService $adminService,
        private AuthService $authService,
    ) {}

    // =========================================================================
    // GET /api/auth/users — Lister tous les utilisateurs
    // =========================================================================
    #[Route('/users', name: 'api_admin_list_users', methods: ['GET'])]
    public function listUsers(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $users = $this->adminService->getAllUsers();

        $usersData = array_map(
            fn(User $user) => $this->authService->serializeUser($user, true),
            $users
        );

        return $this->json([
            'count' => count($usersData),
            'users' => $usersData
        ]);
    }

    // =========================================================================
    // PUT /api/auth/admin/users/{id}/promote — Promouvoir en ADMIN
    // =========================================================================
    #[Route('/users/{id}/promote', name: 'api_admin_promote', methods: ['PUT'])]
    public function promote(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        try {
            $targetUser = $this->adminService->findUserOrFail($id);
            $this->adminService->promote($targetUser);

            return $this->json([
                'message' => 'Utilisateur promu administrateur.',
                'user' => $this->authService->serializeUser($targetUser)
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    // =========================================================================
    // PUT /api/auth/admin/users/{id}/demote — Rétrograder
    // =========================================================================
    #[Route('/users/{id}/demote', name: 'api_admin_demote', methods: ['PUT'])]
    public function demote(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        try {
            $targetUser = $this->adminService->findUserOrFail($id);
            /** @var User $currentUser */
            $currentUser = $this->getUser();
            $this->adminService->demote($targetUser, $currentUser);

            return $this->json([
                'message' => 'Rôle ADMIN retiré.',
                'user' => $this->authService->serializeUser($targetUser)
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 403);
        }
    }

    // =========================================================================
    // DELETE /api/auth/admin/users/{id} — Supprimer un utilisateur
    // =========================================================================
    #[Route('/users/{id}', name: 'api_admin_delete_user', methods: ['DELETE'])]
    public function deleteUser(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        try {
            $targetUser = $this->adminService->findUserOrFail($id);
            /** @var User $currentUser */
            $currentUser = $this->getUser();
            $email = $this->adminService->deleteUser($targetUser, $currentUser);

            return $this->json([
                'message' => "Utilisateur {$email} supprimé avec succès."
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 403);
        }
    }
}

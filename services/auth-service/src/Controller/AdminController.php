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
use Symfony\Component\HttpFoundation\Request;
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
    // PUT /api/auth/admin/users/{id}/roles — Mettre a jour les roles generique
    // =========================================================================
    #[Route('/users/{id}/roles', name: 'api_admin_update_roles', methods: ['PUT'])]
    public function updateRoles(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        try {
            $targetUser = $this->adminService->findUserOrFail($id);
            /** @var User $currentUser */
            $currentUser = $this->getUser();
            
            $data = json_decode($request->getContent(), true) ?? [];
            if (!isset($data['roles']) || !is_array($data['roles'])) {
                return $this->json(['error' => 'La cle roles (tableau) est requise.'], 400);
            }

            $this->adminService->updateRoles($targetUser, $currentUser, $data['roles']);

            return $this->json([
                'message' => 'Roles mis a jour avec succes.',
                'user' => $this->authService->serializeUser($targetUser)
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
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

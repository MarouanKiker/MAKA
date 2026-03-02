<?php
// =============================================================================
// AuthController — Endpoints d'authentification (thin controller)
// Délègue la logique métier à AuthService
// =============================================================================

namespace App\Controller;

use App\DTO\ChangePasswordDTO;
use App\DTO\ForgotPasswordDTO;
use App\DTO\RegisterDTO;
use App\DTO\ResetPasswordDTO;
use App\Entity\User;
use App\Service\AuthService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private AuthService $authService,
    ) {}

    // =========================================================================
    // POST /api/auth/login — Connexion (gérée par LexikJWT)
    // =========================================================================
    #[Route('/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        return $this->json(['message' => 'Login géré par LexikJWT']);
    }

    // =========================================================================
    // POST /api/auth/register — Inscription
    // =========================================================================
    #[Route('/register', name: 'api_auth_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        try {
            $dto = RegisterDTO::fromArray(json_decode($request->getContent(), true) ?? []);
            $user = $this->authService->register($dto);

            return $this->json([
                'message' => 'Utilisateur créé avec succès.',
                'user' => $this->authService->serializeUser($user)
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    // =========================================================================
    // GET /api/auth/profile — Profil de l'utilisateur connecté
    // =========================================================================
    #[Route('/profile', name: 'api_auth_profile', methods: ['GET'])]
    public function profile(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        return $this->json([
            'user' => $this->authService->serializeUser($user, true)
        ]);
    }

    // =========================================================================
    // POST /api/auth/logout — Déconnexion (stateless)
    // =========================================================================
    #[Route('/logout', name: 'api_auth_logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        return $this->json([
            'message' => 'Déconnexion réussie. Supprimez le token côté client.'
        ]);
    }

    // =========================================================================
    // PUT /api/auth/change-password — Modifier le mot de passe
    // =========================================================================
    #[Route('/change-password', name: 'api_auth_change_password', methods: ['PUT'])]
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $dto = ChangePasswordDTO::fromArray(json_decode($request->getContent(), true) ?? []);

            /** @var User $user */
            $user = $this->getUser();
            $this->authService->changePassword($user, $dto);

            return $this->json(['message' => 'Mot de passe modifié avec succès.']);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    // =========================================================================
    // POST /api/auth/forgot-password — Demande de réinitialisation
    // =========================================================================
    #[Route('/forgot-password', name: 'api_auth_forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request): JsonResponse
    {
        try {
            $dto = ForgotPasswordDTO::fromArray(json_decode($request->getContent(), true) ?? []);
            $token = $this->authService->forgotPassword($dto);

            $response = [
                'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.'
            ];

            // En dev : retourner le token pour debug
            if ($token && $this->getParameter('kernel.environment') === 'dev') {
                $response['debug_token'] = $token;
                $response['debug_reset_url'] = '/api/auth/reset-password (POST avec {token, new_password})';
            }

            return $this->json($response);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    // =========================================================================
    // POST /api/auth/reset-password — Réinitialisation avec token
    // =========================================================================
    #[Route('/reset-password', name: 'api_auth_reset_password', methods: ['POST'])]
    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $dto = ResetPasswordDTO::fromArray(json_decode($request->getContent(), true) ?? []);
            $this->authService->resetPassword($dto);

            return $this->json([
                'message' => 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'
            ]);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }

    // =========================================================================
    // DELETE /api/auth/account — Supprimer son propre compte
    // =========================================================================
    #[Route('/account', name: 'api_auth_delete_account', methods: ['DELETE'])]
    public function deleteAccount(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true) ?? [];

            if (empty($data['password'])) {
                return $this->json([
                    'error' => 'Le champ "password" est requis pour confirmer la suppression.'
                ], 400);
            }

            /** @var User $user */
            $user = $this->getUser();
            $this->authService->deleteAccount($user, $data['password']);

            return $this->json(['message' => 'Compte supprimé avec succès.']);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 403);
        }
    }
}
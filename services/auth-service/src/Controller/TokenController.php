<?php
// =============================================================================
// TokenController — Endpoints refresh/revoke (thin controller)
// Délègue la logique métier à TokenService
// =============================================================================

namespace App\Controller;

use App\DTO\RefreshTokenDTO;
use App\Service\TokenService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth/token')]
class TokenController extends AbstractController
{
    public function __construct(
        private TokenService $tokenService,
    ) {}

    // =========================================================================
    // POST /api/auth/token/refresh — Rafraîchir le JWT (rotation)
    // =========================================================================
    #[Route('/refresh', name: 'api_auth_token_refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        try {
            $dto = RefreshTokenDTO::fromArray(json_decode($request->getContent(), true) ?? []);
            $result = $this->tokenService->refresh($dto->refreshToken);

            return $this->json($result);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 401);
        }
    }

    // =========================================================================
    // POST /api/auth/token/revoke — Révoquer un refresh token
    // =========================================================================
    #[Route('/revoke', name: 'api_auth_token_revoke', methods: ['POST'])]
    public function revoke(Request $request): JsonResponse
    {
        try {
            $dto = RefreshTokenDTO::fromArray(json_decode($request->getContent(), true) ?? []);
            $this->tokenService->revoke($dto->refreshToken);

            return $this->json(['message' => 'Refresh token révoqué avec succès.']);
        } catch (\InvalidArgumentException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }
}

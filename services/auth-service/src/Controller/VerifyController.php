<?php
// =============================================================================
// VerifyController — Endpoint léger pour validation JWT (gateway auth_request)
// =============================================================================

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class VerifyController extends AbstractController
{
    #[Route('/api/v1/auth/verify', name: 'api_v1_auth_verify', methods: ['GET'])]
    #[Route('/api/auth/verify', name: 'api_auth_verify', methods: ['GET'])]
    public function verify(Request $request): JsonResponse
    {
        // Le firewall JWT valide déjà le token avant d'atteindre ce contrôleur.
        if (!$request->cookies->has('maka_jwt') && !$request->headers->has('Authorization')) {
            return new JsonResponse(['error' => 'Token manquant.'], 401);
        }

        return new JsonResponse(['status' => 'ok'], 200);
    }
}

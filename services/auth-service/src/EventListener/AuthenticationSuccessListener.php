<?php
// =============================================================================
// AuthenticationSuccessListener — Ajouter le refresh token à la réponse login
// Utilise TokenService pour créer le refresh token
// =============================================================================

namespace App\EventListener;

use App\Entity\User;
use App\Service\TokenService;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;

class AuthenticationSuccessListener
{
    public function __construct(
        private TokenService $tokenService,
    ) {}

    /**
     * Appelé après un login JWT réussi.
     * Crée un refresh token et l'ajoute à la réponse.
     */
    public function onAuthenticationSuccess(AuthenticationSuccessEvent $event): void
    {
        /** @var User $user */
        $user = $event->getUser();

        if (!$user instanceof User) {
            return;
        }

        // Créer un refresh token via le service
        $refreshToken = $this->tokenService->createRefreshToken($user);

        // Ajouter le refresh token dans la réponse JSON
        $data = $event->getData();
        $data['refresh_token'] = $refreshToken->getToken();
        $data['refresh_token_expires_at'] = $refreshToken->getExpiresAt()->format('c');
        $event->setData($data);
    }
}

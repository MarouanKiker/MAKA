<?php
// =============================================================================
// JWTCreatedListener - Enrichir le payload JWT
// Ajoute les rôles et l'ID utilisateur dans le token JWT
// =============================================================================

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;

class JWTCreatedListener
{
    /**
     * Appelé quand un JWT est créé par LexikJWT.
     * Enrichit le payload avec des données supplémentaires.
     */
    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        /** @var User $user */
        $user = $event->getUser();
        $payload = $event->getData();

        // Ajouter l'ID et les rôles dans le payload JWT
        $payload['user_id'] = $user->getId();
        $payload['roles'] = $user->getRoles();
        $payload['email'] = $user->getEmail();

        $event->setData($payload);
    }
}

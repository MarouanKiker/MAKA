<?php

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_created')]
class JwtCreatedListener
{
    public function __invoke(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();
        $payload = $event->getData();

        // Enrich JWT payload with additional user data
        $payload['nom']    = method_exists($user, 'getNom') ? $user->getNom() : null;
        $payload['prenom'] = method_exists($user, 'getPrenom') ? $user->getPrenom() : null;
        $payload['roles']  = $user->getRoles();

        $event->setData($payload);
    }
}

<?php
// =============================================================================
// LoginJwtCookieListener — Login JWT => cookie HttpOnly/Secure/SameSite=Strict
// =============================================================================

namespace App\EventListener;

use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpKernel\Event\ResponseEvent;

class LoginJwtCookieListener
{
    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $response = $event->getResponse();
        $path = $request->getPathInfo();

        if (!in_array($path, ['/api/auth/login', '/api/v1/auth/login'], true)) {
            return;
        }

        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            return;
        }

        $data = json_decode($response->getContent(), true);
        if (!is_array($data)) {
            return;
        }

        $jwt = $data['token'] ?? $data['access_token'] ?? null;
        if (!is_string($jwt) || $jwt === '') {
            return;
        }

        // Cookie JWT sécurisé: non lisible en JS et envoyé automatiquement au backend.
        $response->headers->setCookie(
            Cookie::create('maka_jwt')
                ->withValue($jwt)
                ->withHttpOnly(true)
                ->withSecure(true)
                ->withSameSite('strict')
                ->withPath('/')
                ->withExpires(new \DateTimeImmutable('+1 hour'))
        );

        // Rétrocompatibilité: on conserve les autres champs (ex: refresh_token), mais pas le JWT.
        unset($data['token'], $data['access_token']);
        $response->setContent((string) json_encode($data, JSON_UNESCAPED_UNICODE));
    }
}

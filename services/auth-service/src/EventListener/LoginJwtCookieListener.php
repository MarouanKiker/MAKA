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

        // Cookie JWT HttpOnly. En HTTPS prod : SameSite=none + Secure. En HTTP local : lax + non sécurisé.
        $secure = $request->isSecure();
        $sameSite = $secure ? 'none' : 'lax';

        $response->headers->setCookie(
            Cookie::create('maka_jwt')
                ->withValue($jwt)
                ->withHttpOnly(true)
                ->withSecure($secure)
                ->withSameSite($sameSite)
                ->withPath('/')
                ->withExpires(new \DateTimeImmutable('+1 hour'))
        );

        // On garde le token dans le JSON pour que le frontend puisse le mettre en header (fallback dev)
        // $response->headers->setCookie(...) est deja fait au dessus pour le mode secure cookie.
        $response->setContent((string) json_encode($data, JSON_UNESCAPED_UNICODE));
    }
}

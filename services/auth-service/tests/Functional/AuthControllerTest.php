<?php

namespace App\Tests\Functional;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AuthControllerTest extends WebTestCase
{
    public function testLoginWithInvalidCredentialsReturns401(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/auth/login', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email'    => 'nonexistent@example.com',
            'password' => 'wrongpassword',
        ]));

        $this->assertResponseStatusCodeSame(401);
    }

    public function testLoginWithMissingFieldsReturns422(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/auth/login', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => '',
        ]));

        $this->assertResponseStatusCodeSame(422);
    }

    public function testRegisterWithValidDataReturns201(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/auth/register', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'nom'      => 'Dupont',
            'prenom'   => 'Jean',
            'email'    => 'jean.dupont.' . uniqid() . '@example.com',
            'password' => 'SecurePass123!',
            'roles'    => ['ROLE_EMPLOYE'],
        ]));

        $this->assertResponseStatusCodeSame(201);
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('email', $data);
    }

    public function testRefreshWithInvalidTokenReturns401(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/auth/refresh', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'refresh_token' => 'invalid_token',
        ]));

        $this->assertResponseStatusCodeSame(401);
    }

    public function testLogoutReturns200(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/auth/logout', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'refresh_token' => 'any_token',
        ]));

        $this->assertResponseStatusCodeSame(200);
    }
}

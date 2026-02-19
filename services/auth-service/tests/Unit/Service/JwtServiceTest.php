<?php

namespace App\Tests\Unit\Service;

use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use App\Service\JwtService;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class JwtServiceTest extends TestCase
{
    private JWTTokenManagerInterface&MockObject $jwtManager;
    private RefreshTokenRepository&MockObject $refreshTokenRepository;
    private JwtService $jwtService;

    protected function setUp(): void
    {
        $this->jwtManager            = $this->createMock(JWTTokenManagerInterface::class);
        $this->refreshTokenRepository = $this->createMock(RefreshTokenRepository::class);

        $this->jwtService = new JwtService($this->jwtManager, $this->refreshTokenRepository);
    }

    public function testGenerateTokenReturnsString(): void
    {
        $user = new User();
        $user->setEmail('test@example.com');

        $this->jwtManager
            ->expects($this->once())
            ->method('create')
            ->with($user)
            ->willReturn('jwt.token.string');

        $token = $this->jwtService->generateToken($user);

        $this->assertIsString($token);
        $this->assertEquals('jwt.token.string', $token);
    }

    public function testValidateTokenReturnsPayloadOnSuccess(): void
    {
        $expectedPayload = ['email' => 'test@example.com', 'roles' => ['ROLE_USER']];

        $this->jwtManager
            ->expects($this->once())
            ->method('parse')
            ->with('valid.token')
            ->willReturn($expectedPayload);

        $payload = $this->jwtService->validateToken('valid.token');

        $this->assertIsArray($payload);
        $this->assertEquals('test@example.com', $payload['email']);
    }

    public function testValidateTokenReturnsNullOnInvalidToken(): void
    {
        $this->jwtManager
            ->expects($this->once())
            ->method('parse')
            ->willThrowException(new \Exception('Invalid token'));

        $payload = $this->jwtService->validateToken('invalid.token');

        $this->assertNull($payload);
    }

    public function testGenerateRefreshTokenCreatesAndPersistsToken(): void
    {
        $user = new User();
        $user->setEmail('test@example.com');

        $this->refreshTokenRepository
            ->expects($this->once())
            ->method('save');

        $rawToken = $this->jwtService->generateRefreshToken($user);

        $this->assertIsString($rawToken);
        $this->assertEquals(128, strlen($rawToken)); // 64 bytes = 128 hex chars
    }
}

<?php
// =============================================================================
// RefreshTokenRepository - Requêtes personnalisées pour les refresh tokens
// =============================================================================

namespace App\Repository;

use App\Entity\RefreshToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RefreshToken>
 */
class RefreshTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RefreshToken::class);
    }

    /**
     * Trouver un refresh token valide (non expiré) par sa valeur.
     */
    public function findValidToken(string $token): ?RefreshToken
    {
        return $this->createQueryBuilder('rt')
            ->where('rt.token = :token')
            ->andWhere('rt.expiresAt > :now')
            ->setParameter('token', $token)
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Supprimer tous les refresh tokens expirés.
     * Retourne le nombre de tokens supprimés.
     */
    public function deleteExpiredTokens(): int
    {
        return $this->createQueryBuilder('rt')
            ->delete()
            ->where('rt.expiresAt <= :now')
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->execute();
    }

    /**
     * Supprimer tous les refresh tokens d'un utilisateur (logout complet).
     */
    public function deleteAllForUser(int $userId): int
    {
        return $this->createQueryBuilder('rt')
            ->delete()
            ->where('rt.user = :userId')
            ->setParameter('userId', $userId)
            ->getQuery()
            ->execute();
    }
}

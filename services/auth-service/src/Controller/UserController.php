<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/users')]
#[IsGranted('ROLE_ADMIN')]
class UserController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepository,
    ) {}

    #[Route('', name: 'user_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $users = $this->userRepository->findAll();
        $data = array_map(fn ($u) => [
            'id'          => $u->getId(),
            'nom'         => $u->getNom(),
            'prenom'      => $u->getPrenom(),
            'email'       => $u->getEmail(),
            'roles'       => $u->getRoles(),
            'isActive'    => $u->isActive(),
            'createdAt'   => $u->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'lastLoginAt' => $u->getLastLoginAt()?->format(\DateTimeInterface::ATOM),
        ], $users);

        return $this->json($data, Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'user_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id'          => $user->getId(),
            'nom'         => $user->getNom(),
            'prenom'      => $user->getPrenom(),
            'email'       => $user->getEmail(),
            'roles'       => $user->getRoles(),
            'isActive'    => $user->isActive(),
            'createdAt'   => $user->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'lastLoginAt' => $user->getLastLoginAt()?->format(\DateTimeInterface::ATOM),
        ], Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'user_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nom'])) {
            $user->setNom($data['nom']);
        }
        if (isset($data['prenom'])) {
            $user->setPrenom($data['prenom']);
        }
        if (isset($data['roles'])) {
            $user->setRoles($data['roles']);
        }
        if (isset($data['isActive'])) {
            $user->setIsActive((bool) $data['isActive']);
        }

        $this->userRepository->save($user, true);

        return $this->json(['message' => 'User updated successfully.'], Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'user_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $user = $this->userRepository->find($id);
        if (!$user) {
            return $this->json(['error' => 'User not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->userRepository->remove($user, true);

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}

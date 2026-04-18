<?php

namespace App\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:create-admin', description: 'Cree l utilisateur admin par defaut')]
class CreateAdminCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $hasher,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $email = 'marouankiker@gmail.com';

        // verifier si l'admin existe deja
        $existing = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        if ($existing) {
            $output->writeln('>>> Admin deja existant, skip.');
            return Command::SUCCESS;
        }

        // creer l'admin
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName('Marouan');
        $user->setLastName('Kiker');
        $user->setRoles(['ROLE_ADMIN']);
        $user->setPassword($this->hasher->hashPassword($user, 'admin123'));

        $this->em->persist($user);
        $this->em->flush();

        $output->writeln('>>> Utilisateur admin cree : ' . $email . ' / admin123');
        return Command::SUCCESS;
    }
}

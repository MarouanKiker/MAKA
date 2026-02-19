<?php

namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

class RegisterRequest
{
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 100)]
    public string $nom = '';

    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 100)]
    public string $prenom = '';

    #[Assert\NotBlank]
    #[Assert\Email]
    public string $email = '';

    #[Assert\NotBlank]
    #[Assert\Length(min: 8)]
    public string $password = '';

    /** @var list<string> */
    #[Assert\All([
        new Assert\Choice(choices: [
            'ROLE_ADMIN', 'ROLE_COMMERCIAL', 'ROLE_RESPONSABLE_STOCK',
            'ROLE_RESPONSABLE_RH', 'ROLE_COMPTABLE', 'ROLE_RESPONSABLE_FINANCIER',
            'ROLE_MAGASINIER', 'ROLE_AGENT_SUPPORT', 'ROLE_RESP_VENTES',
            'ROLE_RESP_MARKETING', 'ROLE_ACHETEUR', 'ROLE_ADV', 'ROLE_EMPLOYE',
        ]),
    ])]
    public array $roles = ['ROLE_EMPLOYE'];
}

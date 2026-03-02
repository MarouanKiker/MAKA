<?php
// =============================================================================
// Kernel Symfony - Noyau de l'application
// Charge les bundles et la configuration automatiquement
// =============================================================================

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;
}
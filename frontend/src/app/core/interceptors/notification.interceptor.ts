import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

export const notificationInterceptor: HttpInterceptorFn = (req, next) => {
    const notifService = inject(NotificationService);

    return next(req).pipe(
        tap((event) => {
            if (event instanceof HttpResponse) {
                // Intercepter uniquement les requetes de modification reussies
                if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
                    
                    // Ignorer les requetes d'authentification pour ne pas spammer
                    if (req.url.includes('/api/auth')) return;
                    if (req.url.includes('/api/sales/ai/chat')) return;
                    
                    // Extraire le nom de la ressource de l'URL (ex: /api/crm/campagnes -> campagnes)
                    const urlParts = req.url.split('?')[0].split('/');
                    let resourceRaw = urlParts[urlParts.length - 1];
                    
                    // Si l'URL se termine par un ID (ex: /campagnes/12), on prend l'avant-dernier
                    if (!isNaN(Number(resourceRaw)) && urlParts.length > 1) {
                        resourceRaw = urlParts[urlParts.length - 2];
                    }
                    
                    let action = 'Action effectuée';
                    let icon = 'fa-solid fa-check-circle';
                    let color = 'text-emerald-500';

                    if (req.method === 'POST') {
                        action = 'Création réussie';
                        icon = 'fa-solid fa-plus-circle';
                        color = 'text-indigo-500';
                    } else if (req.method === 'PUT') {
                        action = 'Mise à jour réussie';
                        icon = 'fa-solid fa-pen';
                        color = 'text-amber-500';
                    } else if (req.method === 'DELETE') {
                        action = 'Suppression réussie';
                        icon = 'fa-solid fa-trash';
                        color = 'text-rose-500';
                    }

                    // Formater joliment le nom de la ressource
                    const formatResource = (res: string) => {
                        const mapping: Record<string, string> = {
                            'campagnes': 'Campagne',
                            'leads': 'Lead',
                            'opportunites': 'Opportunité',
                            'tasks': 'Tâche',
                            'tickets': 'Ticket',
                            'factures': 'Facture',
                            'paiements': 'Paiement',
                            'employes': 'Employé',
                            'conges': 'Congé',
                            'paie': 'Fiche de paie',
                            'comptes-bancaires': 'Compte bancaire'
                        };
                        return mapping[res] || res.charAt(0).toUpperCase() + res.slice(1);
                    };

                    const resourceName = formatResource(resourceRaw);

                    notifService.add(
                        action,
                        `Opération enregistrée sur : ${resourceName}`,
                        icon,
                        color
                    );
                }
            }
        })
    );
};

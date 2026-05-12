import httpx
from sqlalchemy.orm import Session
from app.models import CommandeVente, Devis, VenteMensuelle, Produit
from datetime import datetime
from app.config import GATEWAY_URL

# ============================================================
# Cross-Analytics — Cerveau IA central de MAKA ERP
# Agrege les donnees de TOUS les modules (CRM, Finance, RH, Ventes)
# via appels HTTP internes aux microservices.
# ============================================================

# Routes internes via la Gateway Docker.
# Important : on garde les memes routes fonctionnelles que le frontend
# (/api/crm, /api/finance, /api/hr) pour eviter les ecarts de donnees.
GATEWAY_BASE = GATEWAY_URL.rstrip("/")
CRM_BASE = f"{GATEWAY_BASE}/api/crm"
FINANCE_BASE = f"{GATEWAY_BASE}/api/finance"
HR_BASE = f"{GATEWAY_BASE}/api/hr"


async def _fetch(client: httpx.AsyncClient, url: str, headers: dict) -> list | dict | None:
    """Appel HTTP interne avec gestion d'erreur silencieuse."""
    try:
        resp = await client.get(url, headers=headers, timeout=5.0)
        if resp.status_code == 200:
            return resp.json()
        print(f"[CrossAnalytics] Appel {url} -> HTTP {resp.status_code}")
    except Exception as e:
        print(f"[CrossAnalytics] Erreur appel {url}: {e}")
    return None


async def generer_cross_analytics(db: Session, token: str = None) -> dict:
    """
    Genere un rapport complet cross-modules :
    - Score de sante entreprise (0-100)
    - KPIs agreges de tous les modules
    - Alertes intelligentes cross-modules
    """
    # Preparer les headers d'auth inter-services
    headers = {}
    if token:
        headers["Cookie"] = f"maka_jwt={token}"
        headers["Authorization"] = f"Bearer {token}"

    # --- 1. Collecter les donnees locales (Sales DB) ---
    produits = db.query(Produit).all()
    devis = db.query(Devis).all()
    commandes = db.query(CommandeVente).all()
    ventes = db.query(VenteMensuelle).order_by(
        VenteMensuelle.annee.desc(), VenteMensuelle.mois.desc()
    ).all()

    ca_total = sum(c.montant_ttc for c in commandes) if commandes else 0
    devis_en_attente = len([d for d in devis if d.statut in ("BROUILLON", "ENVOYE")])
    devis_acceptes = len([d for d in devis if d.statut == "ACCEPTE"])
    taux_conversion = round((devis_acceptes / len(devis)) * 100, 1) if devis else 0

    # CA mois actuel vs precedent
    ca_actuel = ventes[0].chiffre_affaires if ventes else 0
    ca_precedent = ventes[1].chiffre_affaires if len(ventes) >= 2 else 0
    croissance_ca = round(((ca_actuel - ca_precedent) / ca_precedent) * 100, 1) if ca_precedent > 0 else 0

    # --- 2. Collecter les donnees des autres microservices ---
    leads = []
    opportunites = []
    tasks = []
    tickets = []
    factures = []
    paiements = []
    employes = []
    conges = []

    async with httpx.AsyncClient() as client:
        # CRM
        leads_data = await _fetch(client, f"{CRM_BASE}/leads", headers)
        opportunites_data = await _fetch(client, f"{CRM_BASE}/opportunites", headers)
        tasks_data = await _fetch(client, f"{CRM_BASE}/tasks", headers)
        tickets_data = await _fetch(client, f"{CRM_BASE}/tickets", headers)
        crm_ok = any(item is not None for item in [leads_data, opportunites_data, tasks_data, tickets_data])
        leads = leads_data or []
        opportunites = opportunites_data or []
        tasks = tasks_data or []
        tickets = tickets_data or []

        # Finance
        factures_data = await _fetch(client, f"{FINANCE_BASE}/factures", headers)
        paiements_data = await _fetch(client, f"{FINANCE_BASE}/paiements", headers)
        finance_ok = any(item is not None for item in [factures_data, paiements_data])
        factures = factures_data or []
        paiements = paiements_data or []

        # HR
        employes_data = await _fetch(client, f"{HR_BASE}/employes", headers)
        conges_data = await _fetch(client, f"{HR_BASE}/conges", headers)
        rh_ok = any(item is not None for item in [employes_data, conges_data])
        employes = employes_data or []
        conges = conges_data or []

        # Stock
        STOCK_BASE = f"{GATEWAY_BASE}/api/stock"
        stock_data = await _fetch(client, f"{STOCK_BASE}/articles", headers)
        stock_ok = stock_data is not None
        wrapper = stock_data.get("data") if isinstance(stock_data, dict) and "data" in stock_data else stock_data
        if isinstance(wrapper, dict):
            articles_stock = wrapper.get("data") or wrapper.get("content") or wrapper.get("items") or []
        elif isinstance(wrapper, list):
            articles_stock = wrapper
        else:
            articles_stock = []

    # --- 3. Calculer les metriques cross-modules ---

    # CRM
    nb_leads = len(leads)
    leads_nouveaux = len([l for l in leads if str(l.get("statut", "") or l.get("Statut", "")).upper() in ("NOUVEAU", "NEW", "0")])
    leads_qualifies = len([l for l in leads if str(l.get("statut", "") or l.get("Statut", "")).upper() in ("QUALIFIE", "QUALIFIED", "CONTACTE", "1")])
    pipeline_total = sum(float(o.get("montant", 0) or o.get("Montant", 0) or o.get("valeur", 0) or o.get("Valeur", 0) or 0) for o in opportunites)
    opps_gagnees = len([o for o in opportunites if str(o.get("statut", "") or o.get("Statut", "")).upper() in ("GAGNEE", "WON", "FERMEE_GAGNEE", "2", "GAGNÉE")])
    tasks_en_retard = len([t for t in tasks if str(t.get("statut", "") or t.get("Statut", "")).upper() in ("EN_RETARD", "OVERDUE")])
    tickets_ouverts = len([t for t in tickets if str(t.get("statut", "") or t.get("Statut", "")).upper() in ("OUVERT", "OPEN", "EN_COURS", "NOUVEAU")])

    # Finance
    factures_impayees = len([f for f in factures if str(f.get("statut", "") or f.get("Statut", "")).upper() not in ("PAYEE", "PAID", "PAYÉE", "4", "VALIDEE", "VALIDATED", "1")])
    montant_impaye = sum(float(f.get("resteAPayer", 0) or f.get("ResteAPayer", 0) or f.get("reste_a_payer", 0) or 0) for f in factures)
    nb_factures = len(factures)

    # HR
    nb_employes = len(employes)
    conges_en_cours = len([c for c in conges if str(c.get("statut", "") or c.get("Statut", "")).upper() in ("APPROUVE", "APPROVED", "EN_COURS", "ACCEPTE")])

    # --- 4. Calculer le Score de Sante (0-100) ---
    score = 50  # base

    # Bonus/Malus Ventes (+/-20 max)
    if croissance_ca > 10:
        score += 15
    elif croissance_ca > 0:
        score += 8
    elif croissance_ca > -10:
        score -= 5
    else:
        score -= 15

    if taux_conversion > 60:
        score += 5
    elif taux_conversion < 30:
        score -= 5

    # Bonus/Malus CRM (+/-15 max)
    if leads_nouveaux > 0:
        score += min(leads_nouveaux * 2, 10)
    if tasks_en_retard > 3:
        score -= 5
    if tickets_ouverts > 5:
        score -= 5
    else:
        score += 5

    # Bonus/Malus Finance (+/-15 max)
    if factures_impayees == 0:
        score += 10
    elif factures_impayees <= 3:
        score += 3
    elif factures_impayees > 5:
        score -= 10
    else:
        score -= 3

    # --- RECOMPENSES DYNAMIQUES DES ACTIONS REELLES UTILISATEUR ---
    # Récompenser fortement chaque opportunité gagnée
    if opps_gagnees > 0:
        score += opps_gagnees * 15
    # Récompenser les leads qualifiés en cours
    if leads_qualifies > 0:
        score += leads_qualifies * 5
    # Récompenser les factures payées ou validées
    factures_payees = len([f for f in factures if str(f.get("statut", "") or f.get("Statut", "")).upper() in ("PAYEE", "PAID", "PAYÉE", "VALIDEE", "VALIDATED", "1", "4")])
    if factures_payees > 0:
        score += factures_payees * 10

    # Clamp entre 0 et 100
    score = max(0, min(100, score))

    # Niveau de sante
    if score >= 75:
        niveau_sante = "Excellent"
        couleur_sante = "#10b981"
    elif score >= 50:
        niveau_sante = "Bon"
        couleur_sante = "#3b82f6"
    elif score >= 30:
        niveau_sante = "Attention"
        couleur_sante = "#f59e0b"
    else:
        niveau_sante = "Critique"
        couleur_sante = "#ef4444"

    # --- 5. Generer les alertes intelligentes ---
    alertes = []

    if factures_impayees > 0:
        alertes.append({
            "type": "warning",
            "icone": "fa-file-invoice-dollar",
            "titre": f"{factures_impayees} facture(s) impayée(s)",
            "texte": f"Montant total dû : {round(montant_impaye, 0)} MAD. Relance recommandée.",
            "module": "Finance",
        })

    if leads_nouveaux >= 3:
        alertes.append({
            "type": "info",
            "icone": "fa-user-plus",
            "titre": f"{leads_nouveaux} nouveaux leads détectés",
            "texte": "Pipeline en croissance. Assurez-vous d'avoir les ressources commerciales.",
            "module": "CRM",
        })

    if tasks_en_retard > 0:
        alertes.append({
            "type": "warning",
            "icone": "fa-clock",
            "titre": f"{tasks_en_retard} tâche(s) en retard",
            "texte": "Des tâches CRM dépassent leur deadline. Priorisation nécessaire.",
            "module": "CRM",
        })

    if tickets_ouverts > 3:
        alertes.append({
            "type": "warning",
            "icone": "fa-ticket",
            "titre": f"{tickets_ouverts} tickets ouverts",
            "texte": "Volume de tickets élevé. Risque d'impact sur la satisfaction client.",
            "module": "CRM",
        })

    if croissance_ca > 10:
        alertes.append({
            "type": "success",
            "icone": "fa-arrow-trend-up",
            "titre": f"Croissance de +{croissance_ca}%",
            "texte": "Le chiffre d'affaires est en forte hausse. Continuez sur cette lancée !",
            "module": "Ventes",
        })
    elif croissance_ca < -5:
        alertes.append({
            "type": "danger",
            "icone": "fa-arrow-trend-down",
            "titre": f"Baisse du CA de {abs(croissance_ca)}%",
            "texte": "Le chiffre d'affaires recule. Analysez les causes et ajustez la stratégie.",
            "module": "Ventes",
        })

    if conges_en_cours > 0 and leads_nouveaux >= 3:
        alertes.append({
            "type": "warning",
            "icone": "fa-triangle-exclamation",
            "titre": "Alerte capacité commerciale",
            "texte": f"{leads_nouveaux} leads arrivent mais {conges_en_cours} employé(s) en congé. Risque de perte d'opportunités.",
            "module": "Cross-Module",
        })

    if devis_en_attente > 5:
        alertes.append({
            "type": "info",
            "icone": "fa-hourglass-half",
            "titre": f"{devis_en_attente} devis en attente",
            "texte": "Des devis attendent une réponse client. Planifiez des relances.",
            "module": "Ventes",
        })

    if pipeline_total > 0:
        alertes.append({
            "type": "info",
            "icone": "fa-funnel-dollar",
            "titre": f"Pipeline CRM : {round(pipeline_total, 0)} MAD",
            "texte": f"{len(opportunites)} opportunités en cours dont {opps_gagnees} gagnée(s).",
            "module": "CRM",
        })

    # Toujours au moins une alerte
    if not alertes:
        alertes.append({
            "type": "success",
            "icone": "fa-check-circle",
            "titre": "Tout est en ordre",
            "texte": "Aucune anomalie détectée. L'entreprise fonctionne normalement.",
            "module": "Système",
        })

    # --- 6. Construire le resultat ---
    return {
        "score_sante": score,
        "niveau_sante": niveau_sante,
        "couleur_sante": couleur_sante,
        "alertes": alertes,
        "kpis": {
            # Ventes
            "ca_total": round(ca_total, 0),
            "ca_mensuel": round(ca_actuel, 0),
            "croissance_ca": croissance_ca,
            "total_produits": len(produits),
            "total_devis": len(devis),
            "total_commandes": len(commandes),
            "taux_conversion": taux_conversion,
            "devis_en_attente": devis_en_attente,
            # CRM
            "total_leads": nb_leads,
            "leads_nouveaux": leads_nouveaux,
            "leads_qualifies": leads_qualifies,
            "pipeline_crm": round(pipeline_total, 0),
            "opportunites": len(opportunites),
            "opps_gagnees": opps_gagnees,
            "tasks_en_retard": tasks_en_retard,
            "tickets_ouverts": tickets_ouverts,
            # Finance
            "total_factures": nb_factures,
            "factures_impayees": factures_impayees,
            "montant_impaye": round(montant_impaye, 0),
            # RH
            "total_employes": nb_employes,
            "conges_en_cours": conges_en_cours,
            # Stock
            "total_articles_stock": len(articles_stock),
            "quantite_stock_totale": sum(int(a.get("stockTotal", 0) or a.get("stock_total", 0) or a.get("quantiteStock", 0) or 0) for a in articles_stock),
            "valeur_stock": round(sum(float(a.get("prixVente", 0) or a.get("prix_vente", 0) or 0) * int(a.get("stockTotal", 0) or a.get("stock_total", 0) or a.get("quantiteStock", 0) or 0) for a in articles_stock), 2),
        },
        "modules_status": {
            "ventes": "ok",
            "crm": "ok" if crm_ok else "auth_required_or_down",
            "finance": "ok" if finance_ok else "auth_required_or_down",
            "rh": "ok" if rh_ok else "auth_required_or_down",
            "stock": "ok" if stock_ok else "auth_required_or_down",
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

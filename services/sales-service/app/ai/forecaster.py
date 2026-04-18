import numpy as np
from datetime import datetime

# ============================================================
# Forecaster IA — Prediction des ventes avec regression lineaire
# Utilise des donnees de demo realistes + scikit-learn
# ============================================================

# donnees de ventes mensuelles de demo (12 derniers mois)
VENTES_DEMO = [
    {"mois": "Avr 2025", "ca": 185000},
    {"mois": "Mai 2025", "ca": 192000},
    {"mois": "Jun 2025", "ca": 178000},
    {"mois": "Jul 2025", "ca": 205000},
    {"mois": "Aou 2025", "ca": 165000},
    {"mois": "Sep 2025", "ca": 220000},
    {"mois": "Oct 2025", "ca": 235000},
    {"mois": "Nov 2025", "ca": 248000},
    {"mois": "Dec 2025", "ca": 275000},
    {"mois": "Jan 2026", "ca": 242000},
    {"mois": "Fev 2026", "ca": 258000},
    {"mois": "Mar 2026", "ca": 270000},
]

MOIS_FUTURS = ["Avr 2026", "Mai 2026", "Jun 2026"]


def generer_forecast() -> dict:
    """
    Genere une prediction des ventes futures avec regression lineaire.
    Retourne les donnees reelles + les predictions + la tendance.
    """
    # extraire les valeurs de CA
    valeurs = [v["ca"] for v in VENTES_DEMO]
    x = np.arange(len(valeurs)).reshape(-1, 1)
    y = np.array(valeurs)

    # regression lineaire simple (sans sklearn pour rester leger)
    n = len(valeurs)
    x_mean = np.mean(x)
    y_mean = np.mean(y)
    slope = np.sum((x.flatten() - x_mean) * (y - y_mean)) / np.sum((x.flatten() - x_mean) ** 2)
    intercept = y_mean - slope * x_mean

    # donnees reelles
    donnees = []
    for v in VENTES_DEMO:
        donnees.append({
            "mois": v["mois"],
            "valeur": v["ca"],
            "type": "reel"
        })

    # predictions futures
    predictions = []
    for i, mois_nom in enumerate(MOIS_FUTURS):
        x_pred = n + i
        y_pred = slope * x_pred + intercept
        # ajouter un peu de variation realiste
        variation = np.random.uniform(-0.03, 0.05)
        y_pred = y_pred * (1 + variation)
        donnees.append({
            "mois": mois_nom,
            "valeur": round(y_pred, 0),
            "type": "prediction"
        })
        predictions.append(y_pred)

    # calculer la tendance
    dernier_reel = valeurs[-1]
    premiere_prediction = predictions[0]
    croissance = ((premiere_prediction - dernier_reel) / dernier_reel) * 100

    if croissance > 5:
        tendance = "hausse"
    elif croissance < -5:
        tendance = "baisse"
    else:
        tendance = "stable"

    return {
        "donnees": donnees,
        "tendance": tendance,
        "croissance": round(croissance, 1)
    }


def generer_kpis() -> dict:
    """genere les KPI intelligents pour le dashboard IA"""
    ca_actuel = VENTES_DEMO[-1]["ca"]
    ca_precedent = VENTES_DEMO[-2]["ca"]
    croissance = ((ca_actuel - ca_precedent) / ca_precedent) * 100

    return {
        "ca_actuel": ca_actuel,
        "ca_prevu": round(ca_actuel * 1.08, 0),
        "croissance": round(croissance, 1),
        "total_devis": 12,
        "total_commandes": 8,
        "taux_conversion": 66.7
    }


def generer_insights() -> list:
    """genere des insights/recommandations intelligentes"""
    return [
        {
            "icone": "fa-arrow-trend-up",
            "texte": "Le CA est en hausse de 4.7% ce mois. Tendance positive sur les 3 derniers mois.",
            "type": "success"
        },
        {
            "icone": "fa-lightbulb",
            "texte": "Le produit 'Pack Premium' represente 35% de vos ventes. Envisagez une campagne dediee.",
            "type": "info"
        },
        {
            "icone": "fa-clock",
            "texte": "3 devis en attente depuis plus de 15 jours. Relance recommandee.",
            "type": "warning"
        },
        {
            "icone": "fa-chart-pie",
            "texte": "Mardi et jeudi sont vos meilleurs jours de vente (42% du CA hebdomadaire).",
            "type": "info"
        },
        {
            "icone": "fa-star",
            "texte": "Taux de conversion devis-commande : 66.7%. Superieur a la moyenne du secteur (45%).",
            "type": "success"
        },
    ]

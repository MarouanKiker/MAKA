import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sqlalchemy.orm import Session
from app.models import VenteMensuelle, CommandeVente, Devis
from datetime import datetime

# ============================================================
# Forecaster IA — Prediction des ventes avec Gradient Boosting
# Lit les vraies donnees de la BDD (pas de donnees hardcodees)
# ============================================================

MOIS_NOMS = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"]


def generer_forecast(db: Session):
    """
    Genere une prediction des ventes futures avec Gradient Boosting.
    Les donnees viennent de la table ventes_mensuelles de PostgreSQL.
    """
    # recuperer les ventes mensuelles depuis la base
    ventes = db.query(VenteMensuelle).order_by(VenteMensuelle.annee, VenteMensuelle.mois).all()

    if len(ventes) < 6:
        return {"erreur": "Pas assez de donnees pour une prediction (minimum 6 mois)", "donnees": []}

    # preparer les features : [index, mois, annee]
    X = []
    y = []
    for i, v in enumerate(ventes):
        X.append([i, v.mois, v.annee])
        y.append(v.chiffre_affaires)

    X = np.array(X)
    y = np.array(y)

    # entrainer un Gradient Boosting Regressor
    modele = GradientBoostingRegressor(
        n_estimators=80,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
    )
    modele.fit(X, y)

    # score du modele (R2 sur les donnees d'entrainement)
    r2_score = round(float(modele.score(X, y)) * 100, 1)

    # donnees reelles
    donnees = []
    for v in ventes:
        nom_mois = MOIS_NOMS[v.mois - 1] + " " + str(v.annee)
        donnees.append({
            "mois": nom_mois,
            "valeur": round(v.chiffre_affaires, 0),
            "type": "reel",
        })

    # predictions pour les 3 prochains mois
    dernier_index = len(ventes) - 1
    dernier_mois = ventes[-1].mois
    derniere_annee = ventes[-1].annee

    predictions_values = []
    for i in range(3):
        mois_futur = dernier_mois + i + 1
        annee_future = derniere_annee
        if mois_futur > 12:
            mois_futur -= 12
            annee_future += 1

        X_pred = np.array([[dernier_index + i + 1, mois_futur, annee_future]])
        y_pred = modele.predict(X_pred)[0]

        nom_mois = MOIS_NOMS[mois_futur - 1] + " " + str(annee_future)
        donnees.append({
            "mois": nom_mois,
            "valeur": round(max(0, y_pred), 0),
            "type": "prediction",
        })
        predictions_values.append(y_pred)

    # calculer la tendance
    dernier_reel = y[-1]
    premiere_pred = predictions_values[0]
    croissance = ((premiere_pred - dernier_reel) / dernier_reel) * 100

    if croissance > 5:
        tendance = "hausse"
    elif croissance < -5:
        tendance = "baisse"
    else:
        tendance = "stable"

    return {
        "donnees": donnees,
        "tendance": tendance,
        "croissance": round(croissance, 1),
        "precision_modele": r2_score,
        "modele_utilise": "Gradient Boosting Regressor",
    }


def generer_kpis(db: Session):
    """
    Calcule les KPI depuis les vraies donnees de la BDD.
    Plus de chiffres hardcodes !
    """
    # CA du dernier mois
    ventes = db.query(VenteMensuelle).order_by(VenteMensuelle.annee.desc(), VenteMensuelle.mois.desc()).limit(2).all()

    if len(ventes) >= 2:
        ca_actuel = ventes[0].chiffre_affaires
        ca_precedent = ventes[1].chiffre_affaires
        croissance = ((ca_actuel - ca_precedent) / ca_precedent) * 100 if ca_precedent > 0 else 0
    elif len(ventes) == 1:
        ca_actuel = ventes[0].chiffre_affaires
        ca_precedent = 0
        croissance = 0
    else:
        ca_actuel = 0
        ca_precedent = 0
        croissance = 0

    # compter les devis et commandes
    total_devis = db.query(Devis).count()
    total_commandes = db.query(CommandeVente).count()

    # taux de conversion devis -> commande
    taux_conversion = round((total_commandes / total_devis) * 100, 1) if total_devis > 0 else 0

    # prevision du mois prochain (simple +8% si en croissance, -3% sinon)
    if croissance > 0:
        ca_prevu = ca_actuel * 1.08
    else:
        ca_prevu = ca_actuel * 0.97

    return {
        "ca_actuel": round(ca_actuel, 0),
        "ca_prevu": round(ca_prevu, 0),
        "croissance": round(croissance, 1),
        "total_devis": total_devis,
        "total_commandes": total_commandes,
        "taux_conversion": taux_conversion,
    }


def generer_insights(db: Session):
    """
    Genere des insights intelligents a partir des vraies donnees.
    Analyse les tendances, les meilleurs clients, les alertes.
    """
    insights = []

    # --- analyse de croissance ---
    ventes = db.query(VenteMensuelle).order_by(VenteMensuelle.annee.desc(), VenteMensuelle.mois.desc()).limit(3).all()
    if len(ventes) >= 2:
        croissance = ((ventes[0].chiffre_affaires - ventes[1].chiffre_affaires) / ventes[1].chiffre_affaires) * 100
        if croissance > 0:
            insights.append({
                "icone": "fa-arrow-trend-up",
                "texte": f"Le CA est en hausse de {round(croissance, 1)}% ce mois. Tendance positive.",
                "type": "success",
            })
        else:
            insights.append({
                "icone": "fa-arrow-trend-down",
                "texte": f"Le CA est en baisse de {round(abs(croissance), 1)}% ce mois. Attention.",
                "type": "warning",
            })

    # --- analyse des devis en attente ---
    devis_en_attente = db.query(Devis).filter(Devis.statut.in_(["BROUILLON", "ENVOYE"])).count()
    if devis_en_attente > 0:
        insights.append({
            "icone": "fa-clock",
            "texte": f"{devis_en_attente} devis en attente de reponse. Relance recommandee.",
            "type": "warning",
        })

    # --- meilleur client ---
    commandes = db.query(CommandeVente).all()
    if commandes:
        ca_par_client = {}
        for cmd in commandes:
            ca_par_client[cmd.client] = ca_par_client.get(cmd.client, 0) + cmd.montant_ttc

        meilleur_client = max(ca_par_client, key=ca_par_client.get)
        part = (ca_par_client[meilleur_client] / sum(ca_par_client.values())) * 100

        insights.append({
            "icone": "fa-star",
            "texte": f"'{meilleur_client}' est votre meilleur client ({round(part, 0)}% du CA).",
            "type": "info",
        })

    # --- taux de conversion ---
    total_devis = db.query(Devis).count()
    devis_acceptes = db.query(Devis).filter(Devis.statut == "ACCEPTE").count()
    if total_devis > 0:
        taux = (devis_acceptes / total_devis) * 100
        if taux > 50:
            insights.append({
                "icone": "fa-chart-pie",
                "texte": f"Taux de conversion devis : {round(taux, 1)}%. Excellent !",
                "type": "success",
            })
        else:
            insights.append({
                "icone": "fa-chart-pie",
                "texte": f"Taux de conversion devis : {round(taux, 1)}%. A ameliorer.",
                "type": "info",
            })

    # toujours avoir au moins un insight
    if not insights:
        insights.append({
            "icone": "fa-lightbulb",
            "texte": "Commencez a creer des devis et commandes pour obtenir des analyses.",
            "type": "info",
        })

    return insights

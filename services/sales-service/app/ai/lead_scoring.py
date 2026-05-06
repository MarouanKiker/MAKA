import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import random

# ============================================================
# Lead Scoring — Modele ML qui predit la probabilite de conversion
# Utilise un RandomForest entraine sur l'historique des leads
# ============================================================

# le modele entraine (garde en memoire apres le premier entrainement)
modele_entraine = None
noms_features = ["source", "nb_interactions", "anciennete_jours", "montant_estime", "priorite"]


def generer_historique_leads(n=200):
    """
    Genere un historique de leads avec leurs features et s'ils ont ete convertis ou non.
    En production, ces donnees viendraient de la base CRM.
    """
    sources = {"Site Web": 0, "LinkedIn": 1, "Salon Pro": 2, "Recommandation": 3, "Cold Call": 4, "Email": 5}
    historique = []

    for i in range(n):
        source = random.choice(list(sources.values()))
        nb_interactions = random.randint(0, 20)
        anciennete = random.randint(1, 365)
        montant = random.choice([5000, 10000, 15000, 25000, 45000, 80000])
        priorite = random.randint(1, 5)

        # la probabilite de conversion depend des features (logique metier)
        score_conversion = 0
        score_conversion += min(nb_interactions * 5, 30)  # plus d'interactions = mieux
        score_conversion += 20 if source == 3 else 0  # recommandation = bonus
        score_conversion += 15 if montant >= 25000 else 0  # gros montant = bonus
        score_conversion += 10 if priorite >= 4 else 0  # haute priorite = bonus
        score_conversion -= 15 if anciennete > 180 else 0  # trop vieux = malus

        # convertir en 0 ou 1 avec un peu de bruit aleatoire
        proba = min(max(score_conversion / 100, 0.05), 0.95)
        converti = 1 if random.random() < proba else 0

        historique.append({
            "features": [source, nb_interactions, anciennete, montant, priorite],
            "converti": converti,
        })

    return historique


def entrainer_modele():
    """
    Entraine le modele RandomForest sur l'historique des leads.
    Retourne le modele entraine et son accuracy.
    """
    global modele_entraine

    # generer les donnees d'entrainement
    historique = generer_historique_leads(300)

    # preparer les tableaux numpy
    X = np.array([h["features"] for h in historique])
    y = np.array([h["converti"] for h in historique])

    # separer en train/test (80/20)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # entrainer le RandomForest
    modele = RandomForestClassifier(
        n_estimators=50,  # 50 arbres
        max_depth=8,
        random_state=42,
    )
    modele.fit(X_train, y_train)

    # calculer l'accuracy sur le jeu de test
    accuracy = modele.score(X_test, y_test)

    # sauvegarder le modele en memoire
    modele_entraine = modele

    # importance des features
    importances = dict(zip(noms_features, [round(float(v), 3) for v in modele.feature_importances_]))

    return {
        "accuracy": round(float(accuracy) * 100, 1),
        "nb_entrainement": len(X_train),
        "nb_test": len(X_test),
        "importances_features": importances,
    }


def scorer_lead(source: int, nb_interactions: int, anciennete_jours: int, montant_estime: float, priorite: int):
    """
    Predit le score de conversion d'un lead (0 a 100).
    Si le modele n'est pas encore entraine, on l'entraine d'abord.
    """
    global modele_entraine

    # entrainer le modele s'il n'existe pas encore
    if modele_entraine is None:
        entrainer_modele()

    # preparer les features du lead
    features = np.array([[source, nb_interactions, anciennete_jours, montant_estime, priorite]])

    # predire la probabilite de conversion
    proba = modele_entraine.predict_proba(features)[0]

    # proba[1] = probabilite de la classe 1 (converti)
    score = round(float(proba[1]) * 100, 1)

    # determiner le niveau de qualite
    if score >= 70:
        niveau = "Chaud"
    elif score >= 40:
        niveau = "Tiede"
    else:
        niveau = "Froid"

    return {
        "score": score,
        "niveau": niveau,
        "probabilite_conversion": round(float(proba[1]), 3),
        "details": {
            "source": source,
            "nb_interactions": nb_interactions,
            "anciennete_jours": anciennete_jours,
            "montant_estime": montant_estime,
            "priorite": priorite,
        }
    }


def scorer_leads_batch(leads: list):
    """
    Score plusieurs leads d'un coup.
    Chaque lead est un dict avec les features.
    """
    resultats = []
    for lead in leads:
        score = scorer_lead(
            source=lead.get("source", 0),
            nb_interactions=lead.get("nb_interactions", 0),
            anciennete_jours=lead.get("anciennete_jours", 30),
            montant_estime=lead.get("montant_estime", 10000),
            priorite=lead.get("priorite", 3),
        )
        resultats.append(score)

    return resultats

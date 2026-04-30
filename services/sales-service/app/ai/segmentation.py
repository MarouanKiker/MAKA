import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session
from app.models import CommandeVente
from datetime import datetime, timedelta

# ============================================================
# Segmentation Clients — Clustering K-Means
# Regroupe automatiquement les clients en segments
# basé sur leur comportement d'achat reel (donnees BDD)
# ============================================================

# noms des segments decouverts par le modele
NOMS_SEGMENTS = {
    0: {"nom": "VIP", "icone": "🏆", "couleur": "#FFD700"},
    1: {"nom": "Regulier", "icone": "📊", "couleur": "#4CAF50"},
    2: {"nom": "Occasionnel", "icone": "🔄", "couleur": "#2196F3"},
    3: {"nom": "A Risque", "icone": "⚠️", "couleur": "#FF5722"},
}


def extraire_features_clients(db: Session):
    """
    Extrait les features de chaque client a partir des commandes de vente.
    Features : CA total, nombre de commandes, panier moyen, anciennete
    """
    # recuperer toutes les commandes de vente
    commandes = db.query(CommandeVente).all()

    if len(commandes) < 4:
        return None, None

    # regrouper par client
    clients = {}
    for cmd in commandes:
        if cmd.client not in clients:
            clients[cmd.client] = {"commandes": [], "dates": []}
        clients[cmd.client]["commandes"].append(cmd.montant_ttc)
        clients[cmd.client]["dates"].append(cmd.date_creation)

    # calculer les features pour chaque client
    noms_clients = []
    features = []
    for nom, data in clients.items():
        ca_total = sum(data["commandes"])
        nb_commandes = len(data["commandes"])
        panier_moyen = ca_total / nb_commandes if nb_commandes > 0 else 0

        # anciennete = jours depuis la premiere commande
        dates_valides = [d for d in data["dates"] if d is not None]
        if dates_valides:
            premiere_commande = min(dates_valides)
            anciennete = (datetime.utcnow() - premiere_commande).days
        else:
            anciennete = 0

        noms_clients.append(nom)
        features.append([ca_total, nb_commandes, panier_moyen, anciennete])

    return noms_clients, np.array(features)


def segmenter_clients(db: Session):
    """
    Execute le clustering K-Means sur les clients.
    Retourne les segments avec les details de chaque client.
    """
    noms_clients, features = extraire_features_clients(db)

    if features is None or len(features) < 4:
        # pas assez de donnees pour segmenter
        return {
            "erreur": "Pas assez de clients pour la segmentation (minimum 4)",
            "segments": [],
        }

    # nombre de clusters (min entre 4 et le nombre de clients)
    n_clusters = min(4, len(features))

    # normaliser les features (important pour K-Means)
    scaler = StandardScaler()
    features_normalisees = scaler.fit_transform(features)

    # entrainer K-Means
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(features_normalisees)

    # trier les clusters par CA moyen (le plus haut CA = VIP)
    ca_par_cluster = {}
    for i, label in enumerate(labels):
        if label not in ca_par_cluster:
            ca_par_cluster[label] = []
        ca_par_cluster[label].append(features[i][0])  # CA total

    # ordonner les clusters par CA moyen decroissant
    clusters_ordonnes = sorted(ca_par_cluster.keys(), key=lambda c: np.mean(ca_par_cluster[c]), reverse=True)
    mapping = {}
    for rang, cluster_id in enumerate(clusters_ordonnes):
        mapping[cluster_id] = rang

    # construire le resultat
    segments = {}
    for i in range(n_clusters):
        segment_id = i
        info = NOMS_SEGMENTS.get(segment_id, {"nom": f"Segment {i}", "icone": "📌", "couleur": "#999"})
        segments[segment_id] = {
            "nom": info["nom"],
            "icone": info["icone"],
            "couleur": info["couleur"],
            "clients": [],
        }

    clients_resultat = []
    for i, nom in enumerate(noms_clients):
        segment_id = mapping.get(labels[i], labels[i])
        info_segment = NOMS_SEGMENTS.get(segment_id, {"nom": f"Segment {segment_id}", "icone": "📌"})

        client_data = {
            "nom": nom,
            "segment": info_segment["nom"],
            "segment_icone": info_segment["icone"],
            "ca_total": round(float(features[i][0]), 2),
            "nb_commandes": int(features[i][1]),
            "panier_moyen": round(float(features[i][2]), 2),
            "anciennete_jours": int(features[i][3]),
        }
        clients_resultat.append(client_data)

        if segment_id in segments:
            segments[segment_id]["clients"].append(client_data)

    # statistiques par segment
    resume_segments = []
    for seg_id, seg_data in segments.items():
        if seg_data["clients"]:
            ca_values = [c["ca_total"] for c in seg_data["clients"]]
            resume_segments.append({
                "nom": seg_data["nom"],
                "icone": seg_data["icone"],
                "couleur": seg_data["couleur"],
                "nb_clients": len(seg_data["clients"]),
                "ca_moyen": round(float(np.mean(ca_values)), 2),
                "ca_total": round(float(np.sum(ca_values)), 2),
            })

    return {
        "n_clusters": n_clusters,
        "n_clients": len(noms_clients),
        "segments": resume_segments,
        "clients": clients_resultat,
    }

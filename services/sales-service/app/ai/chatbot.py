import google.generativeai as genai
from sqlalchemy.orm import Session
from app.config import GEMINI_API_KEY
from app.models import Produit, Devis, CommandeVente, VenteMensuelle

# ============================================================
# Chatbot IA avec RAG (Retrieval Augmented Generation)
# Etape 1: Cherche les vraies donnees dans la BDD
# Etape 2: Donne ces donnees a Gemini comme contexte
# Etape 3: Gemini repond avec les vrais chiffres
# ============================================================

# contexte systeme pour le chatbot
SYSTEM_PROMPT = """Tu es l'assistant intelligent de MAKA ERP, un systeme de gestion d'entreprise.
Tu reponds en francais, de maniere concise et professionnelle.
Tu as acces aux donnees reelles de l'entreprise qui te sont fournies en contexte.
Utilise TOUJOURS les donnees fournies pour repondre avec precision.
Si tu ne sais pas, dis-le honnetement.
Garde tes reponses courtes (3-4 phrases max)."""


def recuperer_contexte_bdd(db: Session):
    """
    Recupere un resume des donnees reelles de la BDD.
    Ce contexte sera injecte dans le prompt pour que l'IA reponde avec de vrais chiffres.
    C'est ca le RAG : on enrichit le prompt avec les vraies donnees.
    """
    contexte = []

    # --- resume des produits ---
    produits = db.query(Produit).all()
    if produits:
        noms = [p.nom for p in produits[:10]]
        contexte.append(f"PRODUITS ({len(produits)} au total): {', '.join(noms)}")

    # --- resume des devis ---
    total_devis = db.query(Devis).count()
    devis_acceptes = db.query(Devis).filter(Devis.statut == "ACCEPTE").count()
    devis_en_attente = db.query(Devis).filter(Devis.statut.in_(["BROUILLON", "ENVOYE"])).count()
    contexte.append(f"DEVIS: {total_devis} total, {devis_acceptes} acceptes, {devis_en_attente} en attente")

    # --- resume des commandes ---
    commandes = db.query(CommandeVente).all()
    if commandes:
        ca_total = sum(c.montant_ttc for c in commandes)
        livrees = len([c for c in commandes if c.statut == "LIVREE"])
        contexte.append(f"COMMANDES VENTE: {len(commandes)} total, {livrees} livrees, CA total = {round(ca_total, 0)} DH")

        # top 3 clients
        ca_par_client = {}
        for c in commandes:
            ca_par_client[c.client] = ca_par_client.get(c.client, 0) + c.montant_ttc
        top_clients = sorted(ca_par_client.items(), key=lambda x: x[1], reverse=True)[:3]
        clients_str = ", ".join([f"{nom} ({round(ca, 0)} DH)" for nom, ca in top_clients])
        contexte.append(f"TOP CLIENTS: {clients_str}")

    # --- resume des ventes mensuelles ---
    ventes = db.query(VenteMensuelle).order_by(VenteMensuelle.annee.desc(), VenteMensuelle.mois.desc()).limit(6).all()
    if ventes:
        mois_str = []
        for v in ventes:
            mois_str.append(f"{v.mois}/{v.annee}: {round(v.chiffre_affaires, 0)} DH")
        contexte.append(f"CA MENSUEL (6 derniers mois): {' | '.join(mois_str)}")

    return "\n".join(contexte)


# reponses pre-ecrites pour le mode demo (quand il n'y a pas de cle API Gemini)
def trouver_reponse_demo(message: str, contexte_bdd: str):
    """
    Mode demo : genere une reponse basee sur les vrais chiffres de la BDD
    meme sans API Gemini.
    """
    message_lower = message.lower()

    # extraire des chiffres du contexte pour les reponses
    if "vente" in message_lower or "chiffre" in message_lower or "ca" in message_lower:
        return f"D'apres les donnees actuelles :\n{contexte_bdd}\n\nLa tendance globale est positive. Consultez l'onglet Forecast pour les predictions detaillees."

    if "devis" in message_lower:
        return f"Voici l'etat des devis :\n{contexte_bdd}\n\nJe recommande de relancer les devis en attente depuis plus de 15 jours."

    if "client" in message_lower:
        return f"Analyse clients :\n{contexte_bdd}\n\nConsultez la segmentation pour voir le detail par cluster."

    if "produit" in message_lower:
        return f"Catalogue produits :\n{contexte_bdd}"

    if "bonjour" in message_lower or "salut" in message_lower:
        return "Bonjour ! Je suis l'assistant IA de MAKA ERP. Je peux analyser vos ventes, devis, clients et produits en temps reel. Que souhaitez-vous savoir ?"

    if "aide" in message_lower or "help" in message_lower:
        return "Je peux vous aider avec : les stats de ventes, l'analyse des devis, le top clients, les previsions de CA, et les recommandations produits. Posez votre question !"

    return f"Voici un resume de vos donnees actuelles :\n{contexte_bdd}\n\nPosez-moi une question plus precise pour une analyse detaillee !"


async def chat(message: str, db: Session = None):
    """
    Chatbot IA avec RAG :
    1. Recupere les donnees reelles de la BDD
    2. Les injecte dans le prompt comme contexte
    3. Gemini repond avec les vrais chiffres
    """
    # etape 1 : recuperer le contexte reel de la BDD (le "R" de RAG)
    contexte_bdd = ""
    if db:
        contexte_bdd = recuperer_contexte_bdd(db)

    # mode demo si pas de cle API
    if not GEMINI_API_KEY:
        return {
            "reponse": trouver_reponse_demo(message, contexte_bdd),
            "source": "demo_rag",
            "contexte_utilise": bool(contexte_bdd),
        }

    # etape 2 et 3 : envoyer a Gemini avec le contexte (le "AG" de RAG)
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # construire le prompt enrichi avec les donnees reelles
        prompt = SYSTEM_PROMPT
        if contexte_bdd:
            prompt += f"\n\nDONNEES ACTUELLES DE L'ENTREPRISE (issues de la base de donnees) :\n{contexte_bdd}"
        prompt += f"\n\nQuestion de l'utilisateur : {message}"

        response = model.generate_content(prompt)
        return {
            "reponse": response.text,
            "source": "gemini_rag",
            "contexte_utilise": bool(contexte_bdd),
        }

    except Exception as e:
        # fallback vers le mode demo en cas d'erreur
        return {
            "reponse": trouver_reponse_demo(message, contexte_bdd),
            "source": "demo_rag_fallback",
            "erreur": str(e),
            "contexte_utilise": bool(contexte_bdd),
        }

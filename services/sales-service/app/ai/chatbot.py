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


async def recuperer_contexte_bdd(db: Session, token: str = None):
    """
    Recupere un resume des donnees reelles de TOUS les modules (Microservices).
    On appelle les autres services via HTTP interne pour avoir une vision globale.
    """
    contexte = []
    
    # Auth inter-services : CRM/Finance acceptent cookie et header Bearer (.NET / Spring).
    headers = {}
    if token:
        headers["Cookie"] = f"maka_jwt={token}"
        headers["Authorization"] = f"Bearer {token}"

    # --- 1. DONNEES VENTES (Local DB) ---
    produits = db.query(Produit).all()
    if produits:
        contexte.append(f"VENTES: {len(produits)} produits au catalogue.")
    
    total_devis = db.query(Devis).count()
    contexte.append(f"DEVIS: {total_devis} au total.")

    commandes = db.query(CommandeVente).all()
    if commandes:
        ca_total = sum(c.montant_ttc for c in commandes)
        contexte.append(f"CHIFFRE AFFAIRES: {round(ca_total, 0)} MAD total.")

    # --- 2. DONNEES CRM (Appel crm-service) ---
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get("http://crm-service:5000/api/crm/leads", headers=headers, timeout=2.0)
            if resp.status_code == 200:
                leads = resp.json()
                nouveaux = len([l for l in leads if l.get('statut') == 'NOUVEAU'])
                contexte.append(f"CRM: {len(leads)} leads au total, dont {nouveaux} nouveaux.")
            
            resp = await client.get("http://crm-service:5000/api/crm/campagnes", headers=headers, timeout=2.0)
            if resp.status_code == 200:
                campagnes = resp.json()
                contexte.append(f"MARKETING: {len(campagnes)} campagnes actives.")
    except Exception:
        contexte.append("CRM: (Service indisponible pour le moment)")

    # --- 3. DONNEES FINANCE (Appel finance-service) ---
    try:
        async with httpx.AsyncClient() as client:
            # L'URL interne de Spring Boot
            resp = await client.get("http://finance-service:6000/api/v1/factures", headers=headers, timeout=2.0)
            if resp.status_code == 200:
                factures = resp.json()
                impayees = len([f for f in factures if f.get('statut') != 'PAYEE'])
                total_du = sum(f.get('resteAPayer', 0) for f in factures)
                contexte.append(f"FINANCE: {len(factures)} factures, {impayees} non payées. Total dû: {round(total_du, 0)} MAD.")
    except Exception:
        contexte.append("FINANCE: (Service indisponible pour le moment)")

    return "\n".join(contexte)


# reponses pre-ecrites pour le mode demo (quand il n'y a pas de cle API Gemini)
def trouver_reponse_demo(message: str, db: Session):
    """
    Mode demo : genere une reponse basee sur les vrais chiffres de la BDD
    en mimant le comportement d'un LLM de maniere naturelle.
    """
    msg = message.lower()

    if "bonjour" in msg or "salut" in msg:
        return "Bonjour ! Je suis MAKA Copilot. Je suis connecté à votre base de données. Vous pouvez me demander par exemple : 'Combien de devis sont en attente ?' ou 'Quel est le CA total ?'"

    if "devis" in msg and "attente" in msg:
        devis_en_attente = db.query(Devis).filter(Devis.statut.in_(["BROUILLON", "ENVOYE"])).count()
        if devis_en_attente > 0:
            return f"Actuellement, vous avez {devis_en_attente} devis en attente de validation. Voulez-vous que je prépare une relance automatique pour ces clients ?"
        return "Bonne nouvelle ! Vous n'avez aucun devis en attente pour le moment."

    if "devis" in msg:
        total = db.query(Devis).count()
        acceptes = db.query(Devis).filter(Devis.statut == "ACCEPTE").count()
        return f"Vous avez {total} devis au total dans le système. Parmi eux, {acceptes} ont été acceptés avec succès."

    if "ca" in msg or "chiffre" in msg or "vente" in msg:
        commandes = db.query(CommandeVente).all()
        ca_total = sum(c.montant_ttc for c in commandes)
        return f"Le chiffre d'affaires total généré par vos ventes s'élève à {round(ca_total, 2)} MAD. La tendance est globalement à la hausse."

    if "client" in msg or "meilleur" in msg or "top" in msg:
        commandes = db.query(CommandeVente).all()
        ca_par_client = {}
        for c in commandes:
            ca_par_client[c.client] = ca_par_client.get(c.client, 0) + c.montant_ttc
        if not ca_par_client:
            return "Vous n'avez pas encore de clients enregistrés avec des commandes."
        top_client = max(ca_par_client.items(), key=lambda x: x[1])
        return f"Votre meilleur client actuel est '{top_client[0]}' avec un total de {round(top_client[1], 2)} MAD commandés."

    if "produit" in msg or "catalogue" in msg:
        produits = db.query(Produit).count()
        return f"Votre catalogue contient actuellement {produits} produits et services actifs. Souhaitez-vous voir lesquels se vendent le mieux ?"

    if "merci" in msg:
        return "Je vous en prie ! N'hésitez pas si vous avez d'autres questions sur vos données ERP."

    # Reponse par defaut plus intelligente
    return "Je suis en mode 'Copilot Local'. Pour pouvoir répondre à des questions complexes ouvertes comme celle-ci, j'ai besoin qu'une clé API IA (ex: Gemini) soit ajoutée dans la configuration système. Pour l'instant, demandez-moi plutôt des choses simples sur le CA, les devis ou les clients !"


import httpx
from app.config import GEMINI_API_KEY, OPENROUTER_API_KEY

async def chat(message: str, db: Session = None, token: str = None):
    """
    Chatbot IA avec RAG :
    1. Recupere les donnees reelles de la BDD
    2. Les injecte dans le prompt comme contexte
    3. Utilise OpenRouter (prioritaire) ou Gemini pour repondre
    """
    # etape 1 : recuperer le contexte reel de la BDD (le "R" de RAG)
    contexte_bdd = ""
    if db:
        contexte_bdd = await recuperer_contexte_bdd(db, token=token)

    # Etape 2 : Si OpenRouter est configure, on l'utilise (plus flexible)
    if OPENROUTER_API_KEY:
        try:
            prompt = SYSTEM_PROMPT
            if contexte_bdd:
                prompt += f"\n\nDONNEES ACTUELLES DE L'ENTREPRISE :\n{contexte_bdd}"
            
            print(f"Tentative OpenRouter avec la clé : {OPENROUTER_API_KEY[:10]}...")
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "X-Title": "MAKA ERP",
                    },
                    json={
                        "model": "nvidia/nemotron-3-super-120b-a12b:free", # Le modèle suggéré par l'utilisateur
                        "messages": [
                            {"role": "user", "content": f"{prompt}\n\nQuestion: {message}"}
                        ]
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "reponse": data['choices'][0]['message']['content'],
                        "source": "openrouter_rag",
                        "contexte_utilise": bool(contexte_bdd),
                    }
                else:
                    print(f"Erreur OpenRouter: {response.text}")
        except Exception as e:
            print(f"Exception OpenRouter: {str(e)}")

    # mode demo si pas de cle API (Gemini ou OpenRouter)
    if not GEMINI_API_KEY:
        return {
            "reponse": trouver_reponse_demo(message, db) if db else "Je ne peux pas accéder à la BDD.",
            "source": "demo_rag",
            "contexte_utilise": bool(contexte_bdd),
        }

    # etape 3 : fallback vers Gemini direct si configurer
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
        # fallback final vers le mode demo en cas d'erreur
        return {
            "reponse": trouver_reponse_demo(message, db) if db else "Erreur de connexion BDD.",
            "source": "demo_rag_fallback",
            "erreur": str(e),
            "contexte_utilise": bool(contexte_bdd),
        }

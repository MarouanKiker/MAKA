import google.generativeai as genai
import httpx
from sqlalchemy.orm import Session
from app.config import GEMINI_API_KEY, OPENROUTER_API_KEY
from app.models import Produit, Devis, CommandeVente, VenteMensuelle

# ============================================================
# Chatbot IA avec RAG++ (Retrieval Augmented Generation)
# Version 2 : Contexte CROSS-MODULES (CRM + Finance + RH + Ventes)
#
# Etape 1: Recupere les donnees de TOUS les microservices
# Etape 2: Injecte le tout comme contexte au LLM
# Etape 3: Le LLM repond avec les vrais chiffres de l'entreprise
# ============================================================

# URLs internes des microservices (reseau Docker hub-network)
CRM_BASE = "http://crm-service:5000/api/crm"
FINANCE_BASE = "http://finance-service:6000/api/v1"
HR_BASE = "http://hr-service:8080/api/hr"

# Prompt systeme enrichi pour le mode "cerveau d'entreprise"
SYSTEM_PROMPT = """Tu es MAKA Copilot, l'assistant IA intelligent de MAKA ERP.
Tu es le CERVEAU CENTRAL de l'entreprise. Tu as acces en temps reel aux donnees de TOUS les modules :
- VENTES : produits, devis, commandes, chiffre d'affaires
- CRM : leads, opportunites, taches, tickets, campagnes
- FINANCE : factures, paiements, tresorerie
- RH : employes, conges

Tu reponds en francais, de maniere concise et professionnelle.
Utilise TOUJOURS les donnees fournies pour repondre avec precision.
Tu peux croiser les donnees entre modules pour donner des insights pertinents.
Quand c'est pertinent, donne des recommandations actionables.
Si tu ne sais pas, dis-le honnetement.
Garde tes reponses courtes et impactantes (3-5 phrases max)."""


async def recuperer_contexte_bdd(db: Session, token: str = None):
    """
    Recupere un resume des donnees reelles de TOUS les modules.
    Appelle les microservices via HTTP interne pour une vision 360°.
    """
    contexte = []

    # Headers d'auth inter-services
    headers = {}
    if token:
        headers["Cookie"] = f"maka_jwt={token}"
        headers["Authorization"] = f"Bearer {token}"

    # --- 1. DONNEES VENTES (Local DB) ---
    produits = db.query(Produit).all()
    if produits:
        top_produits = sorted(produits, key=lambda p: p.prix_vente, reverse=True)[:5]
        noms_top = ", ".join([p.nom for p in top_produits])
        contexte.append(f"VENTES: {len(produits)} produits au catalogue. Top produits: {noms_top}.")

    total_devis = db.query(Devis).count()
    devis_attente = db.query(Devis).filter(Devis.statut.in_(["BROUILLON", "ENVOYE"])).count()
    devis_acceptes = db.query(Devis).filter(Devis.statut == "ACCEPTE").count()
    contexte.append(f"DEVIS: {total_devis} au total, {devis_acceptes} acceptes, {devis_attente} en attente.")

    commandes = db.query(CommandeVente).all()
    if commandes:
        ca_total = sum(c.montant_ttc for c in commandes)
        # Meilleur client
        ca_par_client = {}
        for c in commandes:
            ca_par_client[c.client] = ca_par_client.get(c.client, 0) + c.montant_ttc
        meilleur = max(ca_par_client.items(), key=lambda x: x[1]) if ca_par_client else None
        contexte.append(f"CA TOTAL: {round(ca_total, 0)} MAD sur {len(commandes)} commandes.")
        if meilleur:
            contexte.append(f"MEILLEUR CLIENT: '{meilleur[0]}' avec {round(meilleur[1], 0)} MAD.")

    # Tendance CA
    ventes = db.query(VenteMensuelle).order_by(
        VenteMensuelle.annee.desc(), VenteMensuelle.mois.desc()
    ).limit(3).all()
    if len(ventes) >= 2:
        croissance = ((ventes[0].chiffre_affaires - ventes[1].chiffre_affaires) / ventes[1].chiffre_affaires) * 100
        contexte.append(f"TENDANCE: CA mensuel {'en hausse' if croissance > 0 else 'en baisse'} de {round(abs(croissance), 1)}%.")

    # --- 2. DONNEES CRM (Appel crm-service) ---
    try:
        async with httpx.AsyncClient() as client:
            # Leads
            resp = await client.get(f"{CRM_BASE}/leads", headers=headers, timeout=3.0)
            if resp.status_code == 200:
                leads = resp.json()
                nouveaux = len([l for l in leads if l.get("statut", "").upper() in ("NOUVEAU", "NEW")])
                qualifies = len([l for l in leads if l.get("statut", "").upper() in ("QUALIFIE", "QUALIFIED", "CONTACTE")])
                contexte.append(f"CRM LEADS: {len(leads)} leads — {nouveaux} nouveaux, {qualifies} qualifies.")

            # Opportunites
            resp = await client.get(f"{CRM_BASE}/opportunites", headers=headers, timeout=3.0)
            if resp.status_code == 200:
                opps = resp.json()
                pipeline = sum(float(o.get("montant", 0) or o.get("valeur", 0) or 0) for o in opps)
                contexte.append(f"CRM PIPELINE: {len(opps)} opportunites, valeur pipeline: {round(pipeline, 0)} MAD.")

            # Tickets
            resp = await client.get(f"{CRM_BASE}/tickets", headers=headers, timeout=3.0)
            if resp.status_code == 200:
                tickets = resp.json()
                ouverts = len([t for t in tickets if str(t.get("statut", "")).upper() in ("OUVERT", "OPEN", "EN_COURS", "NOUVEAU")])
                contexte.append(f"CRM TICKETS: {len(tickets)} tickets dont {ouverts} ouverts.")

            # Campagnes
            resp = await client.get(f"{CRM_BASE}/campagnes", headers=headers, timeout=3.0)
            if resp.status_code == 200:
                campagnes = resp.json()
                contexte.append(f"MARKETING: {len(campagnes)} campagnes enregistrees.")
    except Exception:
        contexte.append("CRM: (Service temporairement indisponible)")

    # --- 3. DONNEES FINANCE (Appel finance-service) ---
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{FINANCE_BASE}/factures", headers=headers, timeout=3.0)
            if resp.status_code == 200:
                factures = resp.json()
                impayees = len([f for f in factures if str(f.get("statut", "")).upper() not in ("PAYEE", "PAID", "PAYÉE")])
                total_du = sum(float(f.get("resteAPayer", 0) or f.get("reste_a_payer", 0) or 0) for f in factures)
                contexte.append(f"FINANCE: {len(factures)} factures, {impayees} impayees. Total du: {round(total_du, 0)} MAD.")

            resp = await client.get(f"{FINANCE_BASE}/paiements", headers=headers, timeout=3.0)
            if resp.status_code == 200:
                paiements = resp.json()
                contexte.append(f"PAIEMENTS: {len(paiements)} paiements enregistres.")
    except Exception:
        contexte.append("FINANCE: (Service temporairement indisponible)")

    # --- 4. DONNEES RH (Appel hr-service) ---
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{HR_BASE}/employes", headers=headers, timeout=3.0)
            if resp.status_code == 200:
                employes = resp.json()
                contexte.append(f"RH: {len(employes)} employes dans l'entreprise.")

            resp = await client.get(f"{HR_BASE}/conges", headers=headers, timeout=3.0)
            if resp.status_code == 200:
                conges = resp.json()
                en_cours = len([c for c in conges if str(c.get("statut", "")).upper() in ("APPROUVE", "APPROVED", "EN_COURS", "ACCEPTE")])
                contexte.append(f"CONGES: {len(conges)} demandes, {en_cours} actuellement en cours.")
    except Exception:
        contexte.append("RH: (Service temporairement indisponible)")

    return "\n".join(contexte)


# reponses pre-ecrites pour le mode demo (quand il n'y a pas de cle API)
def trouver_reponse_demo(message: str, db: Session):
    """
    Mode demo : genere une reponse basee sur les vrais chiffres de la BDD
    en mimant le comportement d'un LLM de maniere naturelle.
    """
    msg = message.lower()

    if "bonjour" in msg or "salut" in msg:
        return "Bonjour ! Je suis MAKA Copilot, le cerveau IA de votre ERP. Je suis connecté à tous vos modules (Ventes, CRM, Finance, RH). Posez-moi n'importe quelle question !"

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

    if "sante" in msg or "santé" in msg or "entreprise" in msg:
        commandes = db.query(CommandeVente).all()
        ca = sum(c.montant_ttc for c in commandes)
        devis = db.query(Devis).count()
        return f"Vue d'ensemble : CA total de {round(ca, 0)} MAD, {devis} devis émis, {len(commandes)} commandes. Utilisez le dashboard Cross-Analytics pour une analyse complète !"

    if "merci" in msg:
        return "Je vous en prie ! N'hésitez pas si vous avez d'autres questions sur vos données ERP."

    # Reponse par defaut
    return "Je suis en mode Copilot Local. Pour des réponses IA avancées, une clé API (Gemini/OpenRouter) est nécessaire. En attendant, je peux vous renseigner sur le CA, les devis, les clients, la santé de l'entreprise !"


async def chat(message: str, db: Session = None, token: str = None):
    """
    Chatbot IA avec RAG++ :
    1. Recupere les donnees reelles de TOUS les modules (Ventes + CRM + Finance + RH)
    2. Les injecte dans le prompt comme contexte
    3. Utilise Gemini (prioritaire, plus rapide) puis OpenRouter en fallback
    """
    # etape 1 : recuperer le contexte cross-modules (le "R" de RAG)
    contexte_bdd = ""
    if db:
        contexte_bdd = await recuperer_contexte_bdd(db, token=token)

    # Construire le prompt enrichi
    full_prompt = SYSTEM_PROMPT
    if contexte_bdd:
        full_prompt += f"\n\nDONNEES ACTUELLES DE L'ENTREPRISE (temps reel depuis tous les modules) :\n{contexte_bdd}"
    full_prompt += f"\n\nQuestion de l'utilisateur : {message}"

    # Etape 2 : Gemini en PRIORITE (plus rapide)
    if GEMINI_API_KEY:
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-2.0-flash")

            print(f"[RAG++] Gemini avec contexte cross-modules ({len(contexte_bdd)} chars)")
            response = model.generate_content(full_prompt)
            return {
                "reponse": response.text,
                "source": "gemini_rag_plus",
                "contexte_utilise": bool(contexte_bdd),
            }
        except Exception as e:
            print(f"Exception Gemini: {str(e)}")

    # Etape 3 : Fallback OpenRouter
    if OPENROUTER_API_KEY:
        try:
            print(f"[RAG++] Fallback OpenRouter ({len(contexte_bdd)} chars)")
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "X-Title": "MAKA ERP",
                    },
                    json={
                        "model": "google/gemini-2.0-flash-exp:free",
                        "messages": [
                            {"role": "user", "content": full_prompt}
                        ]
                    },
                    timeout=30.0
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        "reponse": data['choices'][0]['message']['content'],
                        "source": "openrouter_rag_fallback",
                        "contexte_utilise": bool(contexte_bdd),
                    }
                else:
                    print(f"Erreur OpenRouter: {response.text}")
        except Exception as e:
            print(f"Exception OpenRouter: {str(e)}")

    # Mode demo si aucune cle API
    return {
        "reponse": trouver_reponse_demo(message, db) if db else "Je ne peux pas accéder à la BDD.",
        "source": "demo_rag",
        "contexte_utilise": bool(contexte_bdd),
    }

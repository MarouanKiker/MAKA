import google.generativeai as genai
from app.config import GEMINI_API_KEY

# ============================================================
# Chatbot IA — Utilise Gemini API (gratuit)
# Si pas de cle API -> mode demo avec reponses pre-ecrites
# ============================================================

# contexte systeme pour le chatbot
SYSTEM_PROMPT = """Tu es l'assistant intelligent de MAKA ERP, un systeme de gestion d'entreprise.
Tu reponds en francais, de maniere concise et professionnelle.
Tu as acces aux donnees de ventes, devis et commandes de l'entreprise.
Quand on te donne des donnees contextuelles, utilise-les pour repondre precisement.
Si tu ne sais pas, dis-le honnetement.
Garde tes reponses courtes (2-3 phrases max)."""

# reponses pre-ecrites pour le mode demo (sans cle API)
REPONSES_DEMO = {
    "bonjour": "Bonjour ! Je suis l'assistant IA de MAKA ERP. Je peux vous aider a analyser vos ventes, devis et commandes. Que souhaitez-vous savoir ?",
    "lead": "D'apres les donnees du CRM, vous avez actuellement 23 leads actifs dont 8 qualifies. Le taux de conversion est de 34.8%, en hausse de 5% par rapport au mois dernier.",
    "vente": "Le chiffre d'affaires du mois en cours est de 245 000 DH, avec 18 commandes validees. La tendance est en hausse de 12% par rapport au mois precedent.",
    "devis": "Vous avez 7 devis en attente pour un montant total de 89 500 DH. Je vous recommande de relancer les 3 devis de plus de 15 jours.",
    "produit": "Votre produit le plus vendu ce mois est 'Pack Premium' avec 45 unites. Le produit 'Service Consulting' a la meilleure marge (68%).",
    "prevision": "Selon mes predictions, le CA du mois prochain devrait atteindre 275 000 DH (+12.2%). La croissance est portee par le secteur des services.",
    "aide": "Je peux vous aider avec : les statistiques de ventes, l'analyse des devis, les previsions de CA, les recommandations produits, et les alertes de stock. Posez-moi votre question !",
}


def trouver_reponse_demo(message: str) -> str:
    """cherche une reponse demo correspondant aux mots cles du message"""
    message_lower = message.lower()
    for mot_cle, reponse in REPONSES_DEMO.items():
        if mot_cle in message_lower:
            return reponse
    return "Je suis l'assistant MAKA ERP. En mode demo, je peux repondre aux questions sur les leads, ventes, devis, produits et previsions. Essayez par exemple : 'Quelles sont mes ventes ce mois ?'"


async def chat(message: str, contexte: str = "") -> dict:
    """
    Envoie un message au chatbot IA.
    Si GEMINI_API_KEY est configure -> utilise Gemini
    Sinon -> mode demo avec reponses pre-ecrites
    """

    # mode demo si pas de cle API
    if not GEMINI_API_KEY:
        return {
            "reponse": trouver_reponse_demo(message),
            "source": "demo"
        }

    # mode reel avec Gemini API
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-flash-latest")

        # construire le prompt avec le contexte ERP
        prompt = SYSTEM_PROMPT
        if contexte:
            prompt += f"\n\nDonnees actuelles de l'ERP :\n{contexte}"
        prompt += f"\n\nQuestion de l'utilisateur : {message}"

        response = model.generate_content(prompt)
        return {
            "reponse": response.text,
            "source": "gemini"
        }
    except Exception as e:
        # lister les modeles disponibles pour voir ce qui est autorise
        try:
            modeles_dispos = [m.name for m in genai.list_models()]
            noms_modeles = " | Modeles dispos: " + ", ".join(modeles_dispos)
        except Exception:
            noms_modeles = ""
            
        return {
            "reponse": f"❌ Erreur API Gemini : {str(e)}{noms_modeles}",
            "source": "erreur API"
        }

import pika
import json
from datetime import datetime
from app.config import RABBITMQ_URL

# ============================================================
# Publisher RabbitMQ — Envoie des evenements vers les autres services
# Quand une commande de vente est validee, on previent Finance
# ============================================================

# nom de l'exchange et des routing keys (doivent correspondre au definitions.json)
EXCHANGE = "maka.events"
ROUTING_KEY_VENTE_CONCLUE = "finance.vente.conclue"
ROUTING_KEY_PAIEMENT_RECU = "ventes.paiement.recu"


def publier_message(routing_key: str, message: dict):
    """
    Publie un message JSON dans RabbitMQ.
    Le message sera recu par le service qui ecoute la queue correspondante.
    """
    try:
        # connexion a RabbitMQ
        params = pika.URLParameters(RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()

        # declarer l'exchange (s'il n'existe pas deja)
        channel.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)

        # ajouter la date d'envoi au message
        message["date_envoi"] = datetime.utcnow().isoformat()

        # publier le message
        channel.basic_publish(
            exchange=EXCHANGE,
            routing_key=routing_key,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # message persistant
                content_type="application/json"
            )
        )

        connection.close()
        print(f"Message publie sur {routing_key}: {message}")
        return True

    except Exception as e:
        # si RabbitMQ n'est pas disponible, on continue sans bloquer
        print(f"RabbitMQ indisponible, message non envoye: {e}")
        return False


def notifier_vente_conclue(numero_commande: str, client: str, montant_ttc: float):
    """
    Notifie le service Finance qu'une vente a ete conclue.
    Finance recevra ce message et pourra creer une facture automatiquement.
    """
    message = {
        "type": "VENTE_CONCLUE",
        "numero_commande": numero_commande,
        "client": client,
        "montant_ttc": montant_ttc,
    }
    return publier_message(ROUTING_KEY_VENTE_CONCLUE, message)


def notifier_paiement_recu(numero_commande: str, montant: float):
    """
    Notifie que le paiement d'une commande a ete recu.
    """
    message = {
        "type": "PAIEMENT_RECU",
        "numero_commande": numero_commande,
        "montant": montant,
    }
    return publier_message(ROUTING_KEY_PAIEMENT_RECU, message)

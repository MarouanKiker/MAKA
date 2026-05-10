from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime
from typing import Any

import httpx
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session

from app.config import GATEWAY_URL
from app.models import CommandeVente, Devis


SEGMENT_LIBRARY = {
    "vip": {
        "name": "VIP / forte valeur",
        "description": "Clients avec le chiffre d'affaires et la frequence d'achat les plus eleves.",
        "color": "#16a34a",
        "recommendation": "Fidelisation prioritaire, offre premium, suivi commercial direct.",
        "action": "Planifier un appel de fidelisation et proposer une offre annuelle.",
    },
    "growth": {
        "name": "Potentiel de croissance",
        "description": "Clients actifs ou prospects avec devis en cours et probabilite de conversion.",
        "color": "#2563eb",
        "recommendation": "Nurturing commercial, relance ciblee, proposition bundle.",
        "action": "Envoyer une relance personnalisee sur les devis ouverts.",
    },
    "regular": {
        "name": "Clients reguliers",
        "description": "Clients stables avec comportement d'achat recurrent mais valeur moyenne moderee.",
        "color": "#7c3aed",
        "recommendation": "Cross-sell simple et suivi mensuel.",
        "action": "Proposer des produits complementaires selon l'historique d'achat.",
    },
    "risk": {
        "name": "Risque de churn",
        "description": "Clients anciennement actifs avec activite recente faible ou panier en baisse.",
        "color": "#dc2626",
        "recommendation": "Campagne de retention et diagnostic de satisfaction.",
        "action": "Creer une tache CRM de rappel avec motif satisfaction.",
    },
    "prospect": {
        "name": "Prospects / devis",
        "description": "Leads CRM ou clients avec devis sans commande de vente rattachee.",
        "color": "#0f766e",
        "recommendation": "Qualification rapide et conversion en opportunite.",
        "action": "Qualifier le besoin et creer une opportunite si le score est suffisant.",
    },
}


def _clean_name(value: Any) -> str:
    name = str(value or "").strip()
    return name or "Client sans nom"


def _normal_key(value: Any) -> str:
    return _clean_name(value).casefold()


def _as_float(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _as_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)
    if isinstance(value, str) and value.strip():
        raw = value.strip().replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(raw)
            return parsed.replace(tzinfo=None)
        except ValueError:
            return None
    return None


def _days_since(value: datetime | None) -> int:
    if not value:
        return 999
    return max((datetime.utcnow() - value).days, 0)


def _status(value: Any) -> str:
    raw = getattr(value, "value", value)
    return str(raw or "").upper()


def _pick(data: dict[str, Any], *names: str, default: Any = None) -> Any:
    for name in names:
        if name in data:
            return data[name]
        camel = name[:1].lower() + name[1:]
        if camel in data:
            return data[camel]
    return default


def _empty_record(name: str, source: str = "Sales") -> dict[str, Any]:
    return {
        "name": name,
        "source": source,
        "ca_total": 0.0,
        "nb_commandes": 0,
        "nb_devis": 0,
        "devis_acceptes": 0,
        "devis_en_attente": 0,
        "crm_score": 0,
        "crm_source": "N/A",
        "last_activity": None,
        "cluster_id": None,
    }


def _touch(record: dict[str, Any], date_value: datetime | None) -> None:
    if not date_value:
        return
    current = record.get("last_activity")
    if current is None or date_value > current:
        record["last_activity"] = date_value


async def _fetch_gateway_json(client: httpx.AsyncClient, path: str, token: str | None) -> tuple[str, list[dict[str, Any]]]:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    url = f"{GATEWAY_URL.rstrip('/')}{path}"
    try:
        response = await client.get(url, headers=headers)
        if response.status_code in {401, 403}:
            return "auth_required", []
        response.raise_for_status()
        payload = response.json()
        if isinstance(payload, list):
            return "ok", [item for item in payload if isinstance(item, dict)]
        if isinstance(payload, dict):
            data = payload.get("data") or payload.get("items") or payload.get("results") or []
            if isinstance(data, list):
                return "ok", [item for item in data if isinstance(item, dict)]
        return "unexpected_payload", []
    except Exception:
        return "unavailable", []


async def _fetch_crm_context(token: str | None) -> dict[str, Any]:
    if not token:
        return {
            "status": "auth_required",
            "leads": [],
            "opportunities": [],
            "campaigns": [],
        }

    async with httpx.AsyncClient(timeout=3.0) as client:
        leads_status, leads = await _fetch_gateway_json(client, "/api/crm/leads", token)
        opp_status, opportunities = await _fetch_gateway_json(client, "/api/crm/opportunites", token)
        campaigns_status, campaigns = await _fetch_gateway_json(client, "/api/crm/campagnes", token)

    statuses = {leads_status, opp_status, campaigns_status}
    if "ok" in statuses:
        status = "ok"
    elif "auth_required" in statuses:
        status = "auth_required"
    else:
        status = "unavailable"

    return {
        "status": status,
        "leads": leads,
        "opportunities": opportunities,
        "campaigns": campaigns,
    }


def _build_sales_records(db: Session) -> tuple[dict[str, dict[str, Any]], dict[str, Any]]:
    records: dict[str, dict[str, Any]] = {}
    orders = db.query(CommandeVente).all()
    quotes = db.query(Devis).all()

    for order in orders:
        name = _clean_name(order.client)
        key = _normal_key(name)
        record = records.setdefault(key, _empty_record(name))
        amount = _as_float(order.montant_ttc)
        record["ca_total"] += amount
        record["nb_commandes"] += 1
        _touch(record, _as_datetime(order.date_creation))

    for quote in quotes:
        name = _clean_name(quote.client)
        key = _normal_key(name)
        record = records.setdefault(key, _empty_record(name))
        record["nb_devis"] += 1
        quote_status = _status(quote.statut)
        if quote_status == "ACCEPTE":
            record["devis_acceptes"] += 1
        elif quote_status in {"BROUILLON", "ENVOYE"}:
            record["devis_en_attente"] += 1
        _touch(record, _as_datetime(quote.date_creation))

    total_revenue = sum(record["ca_total"] for record in records.values())
    total_orders = sum(record["nb_commandes"] for record in records.values())
    total_quotes = sum(record["nb_devis"] for record in records.values())
    accepted_quotes = sum(record["devis_acceptes"] for record in records.values())

    summary = {
        "customers_from_sales": len(records),
        "total_orders": total_orders,
        "total_quotes": total_quotes,
        "accepted_quotes": accepted_quotes,
        "total_revenue": round(total_revenue, 2),
        "avg_order_value": round(total_revenue / total_orders, 2) if total_orders else 0,
        "conversion_rate": round((accepted_quotes / total_quotes) * 100, 2) if total_quotes else 0,
    }
    return records, summary


def _merge_crm_records(records: dict[str, dict[str, Any]], crm: dict[str, Any]) -> dict[str, Any]:
    leads = crm.get("leads") or []
    sources: Counter[str] = Counter()
    prospects_added = 0

    for lead in leads:
        company = _pick(lead, "Entreprise", "entreprise", default="")
        contact = _pick(lead, "NomContact", "nomContact", default="")
        email = _pick(lead, "Email", "email", default="")
        name = _clean_name(company or contact or email)
        key = _normal_key(name)
        source = _clean_name(_pick(lead, "Source", "source", default="Non precise"))
        sources[source] += 1

        record = records.get(key)
        if record is None:
            record = _empty_record(name, source="CRM")
            records[key] = record
            prospects_added += 1

        record["crm_score"] = max(int(_as_float(_pick(lead, "Score", "score", default=0))), record["crm_score"])
        record["crm_source"] = source
        _touch(record, _as_datetime(_pick(lead, "DateCreation", "dateCreation", default=None)))

    return {
        "prospects_from_crm": prospects_added,
        "crm_leads": len(leads),
        "crm_opportunities": len(crm.get("opportunities") or []),
        "crm_campaigns": len(crm.get("campaigns") or []),
        "channels": [
            {"source": source, "count": count}
            for source, count in sources.most_common()
        ],
    }


def _run_kmeans(records: list[dict[str, Any]]) -> dict[str, Any]:
    if len(records) < 3:
        return {"enabled": False, "n_clusters": 0}

    features = []
    for record in records:
        ca_total = _as_float(record["ca_total"])
        nb_commandes = int(record["nb_commandes"])
        panier_moyen = ca_total / nb_commandes if nb_commandes else 0.0
        conversion = _client_conversion(record)
        recence = _days_since(record.get("last_activity"))
        features.append([
            ca_total,
            nb_commandes,
            panier_moyen,
            int(record["nb_devis"]),
            int(record["devis_en_attente"]),
            conversion * 100,
            min(recence, 999),
            int(record["crm_score"]),
        ])

    n_clusters = min(4, len(records))
    try:
        matrix = StandardScaler().fit_transform(np.array(features, dtype=float))
        labels = KMeans(n_clusters=n_clusters, random_state=42, n_init=10).fit_predict(matrix)
        for record, label in zip(records, labels):
            record["cluster_id"] = int(label)
        return {"enabled": True, "n_clusters": n_clusters}
    except Exception:
        return {"enabled": False, "n_clusters": 0}


def _client_conversion(record: dict[str, Any]) -> float:
    if int(record["nb_devis"]) > 0:
        accepted_ratio = int(record["devis_acceptes"]) / int(record["nb_devis"])
        order_ratio = min(int(record["nb_commandes"]) / int(record["nb_devis"]), 1)
        return max(accepted_ratio, order_ratio)
    return 1.0 if int(record["nb_commandes"]) > 0 else 0.0


def _score_customer(record: dict[str, Any], max_values: dict[str, float]) -> int:
    ca_score = _as_float(record["ca_total"]) / max_values["ca_total"]
    order_score = int(record["nb_commandes"]) / max_values["nb_commandes"]
    quote_score = int(record["nb_devis"]) / max_values["nb_devis"]
    conversion = _client_conversion(record)
    recency = _days_since(record.get("last_activity"))
    recency_bonus = max(0.0, 1 - min(recency, 180) / 180)
    crm_score = int(record["crm_score"]) / 100

    score = (
        38 * ca_score
        + 20 * order_score
        + 16 * conversion
        + 10 * recency_bonus
        + 8 * quote_score
        + 8 * crm_score
    )
    if int(record["devis_en_attente"]) > 0:
        score += 5
    return int(round(min(score, 100)))


def _assign_segment(record: dict[str, Any], score: int) -> str:
    recency = _days_since(record.get("last_activity"))
    has_orders = int(record["nb_commandes"]) > 0
    has_quotes = int(record["nb_devis"]) > 0

    if not has_orders and record.get("source") == "CRM":
        return "growth" if score >= 45 else "prospect"
    if has_orders and recency > 120 and score < 75:
        return "risk"
    if score >= 75:
        return "vip"
    if int(record["devis_en_attente"]) > 0 or score >= 55:
        return "growth"
    if has_quotes and not has_orders:
        return "prospect"
    return "regular"


def _prepare_customer_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    max_values = {
        "ca_total": max([_as_float(record["ca_total"]) for record in records] + [1.0]),
        "nb_commandes": max([int(record["nb_commandes"]) for record in records] + [1]),
        "nb_devis": max([int(record["nb_devis"]) for record in records] + [1]),
    }

    rows = []
    for record in records:
        nb_commandes = int(record["nb_commandes"])
        ca_total = _as_float(record["ca_total"])
        score = _score_customer(record, max_values)
        segment_key = _assign_segment(record, score)
        segment = SEGMENT_LIBRARY[segment_key]
        rows.append({
            "name": record["name"],
            "source": record["source"],
            "segment_key": segment_key,
            "segment": segment["name"],
            "color": segment["color"],
            "ca_total": round(ca_total, 2),
            "nb_commandes": nb_commandes,
            "nb_devis": int(record["nb_devis"]),
            "devis_en_attente": int(record["devis_en_attente"]),
            "panier_moyen": round(ca_total / nb_commandes, 2) if nb_commandes else 0,
            "conversion_rate": round(_client_conversion(record) * 100, 2),
            "recence_jours": _days_since(record.get("last_activity")),
            "crm_score": int(record["crm_score"]),
            "crm_source": record["crm_source"],
            "cluster_id": record.get("cluster_id"),
            "score": score,
            "action": segment["action"],
        })

    return sorted(rows, key=lambda row: (row["score"], row["ca_total"]), reverse=True)


def _prepare_segments(customers: list[dict[str, Any]], total_revenue: float) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for customer in customers:
        grouped[customer["segment_key"]].append(customer)

    segments = []
    for key, rows in grouped.items():
        library = SEGMENT_LIBRARY[key]
        revenue = sum(row["ca_total"] for row in rows)
        orders = sum(row["nb_commandes"] for row in rows)
        quotes = sum(row["nb_devis"] for row in rows)
        conversions = [row["conversion_rate"] for row in rows]
        segments.append({
            "key": key,
            "name": library["name"],
            "description": library["description"],
            "color": library["color"],
            "nb_clients": len(rows),
            "revenue_total": round(revenue, 2),
            "revenue_share": round((revenue / total_revenue) * 100, 2) if total_revenue else 0,
            "avg_order_value": round(revenue / orders, 2) if orders else 0,
            "total_orders": orders,
            "total_quotes": quotes,
            "conversion_rate": round(sum(conversions) / len(conversions), 2) if conversions else 0,
            "recommendation": library["recommendation"],
            "action": library["action"],
        })

    return sorted(segments, key=lambda segment: (segment["revenue_total"], segment["nb_clients"]), reverse=True)


def _prepare_recommendations(segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    recommendations = []
    for segment in segments:
        recommendations.append({
            "segment": segment["name"],
            "priority": "haute" if segment["key"] in {"vip", "risk", "growth"} else "normale",
            "action": segment["action"],
            "expected_impact": (
                "retention et chiffre d'affaires"
                if segment["key"] in {"vip", "risk"}
                else "conversion et qualification"
            ),
        })
    return recommendations[:5]


async def generer_marketing_intelligence(db: Session, token: str | None = None) -> dict[str, Any]:
    records_by_key, sales_summary = _build_sales_records(db)
    crm_context = await _fetch_crm_context(token)
    crm_summary = _merge_crm_records(records_by_key, crm_context)

    records = list(records_by_key.values())
    kmeans = _run_kmeans(records)
    customers = _prepare_customer_rows(records) if records else []
    segments = _prepare_segments(customers, sales_summary["total_revenue"])

    summary = {
        **sales_summary,
        **crm_summary,
        "total_customers": len(customers),
        "segments_count": len(segments),
        "crm_status": crm_context["status"],
    }

    data_sources = [
        "sales-db: commandes_vente",
        "sales-db: devis",
    ]
    if crm_context["status"] == "ok":
        data_sources.extend([
            f"{GATEWAY_URL.rstrip('/')}/api/crm/leads",
            f"{GATEWAY_URL.rstrip('/')}/api/crm/opportunites",
            f"{GATEWAY_URL.rstrip('/')}/api/crm/campagnes",
        ])

    return {
        "summary": summary,
        "segments": segments,
        "customers": customers,
        "channels": crm_summary["channels"],
        "recommendations": _prepare_recommendations(segments),
        "methodology": {
            "algorithm": "KMeans clustering + scoring metier RFM simplifie",
            "kmeans_enabled": kmeans["enabled"],
            "n_clusters": kmeans["n_clusters"],
            "features": [
                "ca_total",
                "nb_commandes",
                "panier_moyen",
                "nb_devis",
                "devis_en_attente",
                "conversion_rate",
                "recence_jours",
                "crm_score",
            ],
            "business_rule": "Les clusters sont interpretes avec des regles marketing pour obtenir VIP, potentiel, regulier, risque et prospect.",
        },
        "modules_status": {
            "sales": "ok",
            "crm": crm_context["status"],
        },
        "data_sources": data_sources,
    }

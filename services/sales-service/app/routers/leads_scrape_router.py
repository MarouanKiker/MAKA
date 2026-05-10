# ============================================================
# Prospection web via DuckDuckGo (duckduckgo-search), sans clé API.
# Ne renvoie que les fiches avec nom, site et email (téléphone optionnel).
# Réponse 200 + liste vide si timeout ou erreur (pas de 500).
# ============================================================
from __future__ import annotations

import asyncio
import logging
import re
from urllib.parse import urlparse

from fastapi import APIRouter
from pydantic import BaseModel, Field, ConfigDict

router = APIRouter(prefix="/api/leads", tags=["Leads — Scraping"])

logger = logging.getLogger(__name__)

SCRAPE_TIMEOUT_SECONDS = 45
PAGE_CONTACT_TIMEOUT_SECONDS = 2.0


class ScrapeRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(..., min_length=1, max_length=500)
    num_results: int = Field(default=5, ge=1, le=10)


class ScrapeLeadJson(BaseModel):
    """Réponse JSON : companyName, website, source."""

    companyName: str
    website: str
    email: str = ""
    phone: str = ""
    source: str = "DuckDuckGo"


def _url_to_https(url_str: str) -> str:
    if not url_str.startswith(("http://", "https://")):
        return f"https://{url_str}"
    return url_str


def _domain_to_company_label(url_str: str) -> str:
    """Déduit un libellé « entreprise » à partir du domaine."""
    try:
        parsed = urlparse(_url_to_https(url_str))
        netloc = (parsed.netloc or "").lower()
        if netloc.startswith("www."):
            netloc = netloc[4:]
        netloc = netloc.split(":")[0]
        if not netloc:
            return url_str
        first = netloc.split(".")[0]
        label = first.replace("-", " ").strip()
        return label.title() if label else netloc
    except Exception:
        return url_str


def _extract_contact_info(text: str) -> tuple[str, str]:
    """Email + téléphone (MA, FR, formats internationaux courants)."""
    clean = " ".join((text or "").split())
    email_match = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", clean, re.I)
    email = email_match.group(0) if email_match else ""

    phone_patterns = (
        r"(?:\+?212|0)(?:[\s.\-()]?\d){8,10}",
        r"(?:\+33\s?|0)[1-9](?:[\s.\-()]?\d){8}",
        r"(?:\+32\s?|0)[1-9](?:[\s.\-()]?\d){7,9}",
        r"(?:\+?\d{1,3}[\s.\-]?)?(?:\(?\d{2,4}\)?[\s.\-]?)\d{2,4}[\s.\-]?\d{2,4}[\s.\-]?\d{2,6}",
    )
    phone = ""
    for pat in phone_patterns:
        m = re.search(pat, clean)
        if not m:
            continue
        candidate = re.sub(r"\s+", " ", m.group(0).strip())
        digits = re.sub(r"\D", "", candidate)
        if len(digits) >= 8:
            phone = candidate
            break
    return email, phone


def _fetch_contact_info(url_str: str) -> tuple[str, str]:
    try:
        import requests

        response = requests.get(
            url_str,
            timeout=PAGE_CONTACT_TIMEOUT_SECONDS,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
                )
            },
        )
        content_type = response.headers.get("content-type", "")
        if response.status_code >= 400 or "text" not in content_type:
            return "", ""
        return _extract_contact_info(response.text[:120000])
    except Exception:
        return "", ""


def _lead_exportable(company: str, website: str, email: str) -> bool:
    """Fiche affichée si nom + site + email (téléphone facultatif)."""
    return bool(
        (company or "").strip()
        and (website or "").strip()
        and (email or "").strip()
    )


def _prospect_query(raw_query: str) -> str:
    """Ajoute une intention B2B quand la recherche est trop generale."""
    q = " ".join(raw_query.split()).strip()
    q_lower = q.lower()
    words = q_lower.split()
    business_terms = (
        "entreprise",
        "entreprises",
        "societe",
        "agence",
        "cabinet",
        "restaurant",
        "hotel",
        "magasin",
        "boutique",
        "fournisseur",
        "industrie",
        "clinique",
        "ecole",
        "marketing",
        "informatique",
        "web",
        "contact",
        "officiel",
        "site",
    )
    if len(words) <= 2 and not any(term in q_lower for term in business_terms):
        return f"{q} entreprises contact"
    if not any(term in q_lower for term in ("contact", "officiel", "site")):
        return f"{q} contact"
    return q


def _dedup_host_key(url_https: str) -> str:
    try:
        p = urlparse(url_https)
        h = (p.netloc or "").lower()
        if h.startswith("www."):
            h = h[4:]
        return h.split(":")[0]
    except Exception:
        return url_https


def _rows_complete_from_ddg(
    results: list[dict] | None,
    num_needed: int,
    seen_hosts: set[str],
) -> list[ScrapeLeadJson]:
    """Construit jusqu'à num_needed fiches avec au moins nom, site et email."""
    out: list[ScrapeLeadJson] = []
    if not results or num_needed <= 0:
        return out

    for r in results:
        raw_url = (r.get("href") or r.get("url") or r.get("link") or "").strip()
        if not raw_url:
            continue
        url_https = _url_to_https(raw_url)
        host_key = _dedup_host_key(url_https)
        if not host_key or host_key in seen_hosts:
            continue

        title = (r.get("title") or "").strip()
        snippet = (r.get("body") or r.get("snippet") or r.get("description") or "").strip()
        label = title.split("|")[0].split("-")[0].strip()[:120] if title else ""
        if not label:
            label = (_domain_to_company_label(url_https) or host_key or "").strip()

        email, phone = _extract_contact_info(f"{title} {snippet} {raw_url}")
        if not email:
            page_email, page_phone = _fetch_contact_info(url_https)
            email = email or page_email
            phone = phone or page_phone
        elif not phone:
            _, page_phone = _fetch_contact_info(url_https)
            phone = phone or page_phone

        if not _lead_exportable(label, url_https, email):
            continue

        seen_hosts.add(host_key)
        out.append(
            ScrapeLeadJson(
                companyName=label,
                website=url_https,
                email=email.strip(),
                phone=(phone or "").strip(),
                source="DuckDuckGo",
            )
        )
        if len(out) >= num_needed:
            break

    return out


def _sync_duckduckgo_search(query: str, num_results: int) -> list[ScrapeLeadJson]:
    try:
        from duckduckgo_search import DDGS
    except ImportError as e:
        logger.warning("duckduckgo-search non installé : %s", e)
        return []

    seen_hosts: set[str] = set()
    combined: list[ScrapeLeadJson] = []
    fetch_n = min(50, max(num_results * 15, 25))

    for region in ("wt-wt", "fr-fr"):
        try:
            with DDGS() as ddgs:
                raw = ddgs.text(
                    query,
                    region=region,
                    max_results=fetch_n,
                    backend="auto",
                    safesearch="moderate",
                )
            need = num_results - len(combined)
            if need <= 0:
                break
            chunk = _rows_complete_from_ddg(raw, need, seen_hosts)
            combined.extend(chunk)
            if len(combined) >= num_results:
                return combined[:num_results]
        except Exception as e:
            logger.warning("DuckDuckGo region=%s : %s", region, e, exc_info=True)

    return combined[:num_results]


@router.post("/scrape", response_model=list[ScrapeLeadJson])
async def scrape_google_leads(body: ScrapeRequest) -> list[ScrapeLeadJson]:
    requested_results = min(body.num_results, 10)
    search_query = _prospect_query(body.query)
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_sync_duckduckgo_search, search_query, requested_results),
            timeout=SCRAPE_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.warning("Timeout DuckDuckGo pour la requête : %s", search_query)
        return []
    except Exception as e:
        logger.warning("Erreur recherche DuckDuckGo : %s", e, exc_info=True)
        return []

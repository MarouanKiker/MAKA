import logging
from typing import Any

import httpx

from app.config import (
    MCP_CALENDAR_CONNECTOR_URL,
    MCP_CONNECTOR_TOKEN,
    MCP_EMAIL_CONNECTOR_URL,
    MCP_TIMEOUT_SECONDS,
)
from app.schemas import McpCalendarEventRequest, McpEmailDraftRequest

logger = logging.getLogger(__name__)


def _connector_configured(url: str) -> bool:
    return bool(url and url.strip())


def _headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if MCP_CONNECTOR_TOKEN:
        headers["Authorization"] = f"Bearer {MCP_CONNECTOR_TOKEN}"
    return headers


async def _post_to_connector(base_url: str, path: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = f"{base_url.rstrip('/')}{path}"
    async with httpx.AsyncClient(timeout=MCP_TIMEOUT_SECONDS) as client:
        response = await client.post(url, json=payload, headers=_headers())
        response.raise_for_status()
        return response.json()


def get_mcp_status() -> dict[str, Any]:
    email_configured = _connector_configured(MCP_EMAIL_CONNECTOR_URL)
    calendar_configured = _connector_configured(MCP_CALENDAR_CONNECTOR_URL)

    return {
        "mode": "mcp_http_bridge",
        "connected": email_configured or calendar_configured,
        "connectors": {
            "email": {
                "name": "Email",
                "configured": email_configured,
                "provider": "mcp-email" if email_configured else "local-draft",
                "route": "/api/sales/ai/mcp/email/draft",
                "capabilities": ["draft_email"],
            },
            "calendar": {
                "name": "Agenda",
                "configured": calendar_configured,
                "provider": "mcp-calendar" if calendar_configured else "local-proposal",
                "route": "/api/sales/ai/mcp/calendar/event",
                "capabilities": ["propose_event"],
            },
        },
    }


async def create_email_draft(req: McpEmailDraftRequest) -> dict[str, Any]:
    payload = req.model_dump()
    if _connector_configured(MCP_EMAIL_CONNECTOR_URL):
        try:
            data = await _post_to_connector(MCP_EMAIL_CONNECTOR_URL, "/email/draft", payload)
            return {
                "status": "sent_to_mcp",
                "provider": "mcp-email",
                "result": data,
            }
        except Exception as exc:
            logger.exception("MCP email connector unavailable: %s", exc)
            return _local_email_draft(req, error=str(exc))

    return _local_email_draft(req)


async def create_calendar_event(req: McpCalendarEventRequest) -> dict[str, Any]:
    payload = req.model_dump()
    if _connector_configured(MCP_CALENDAR_CONNECTOR_URL):
        try:
            data = await _post_to_connector(MCP_CALENDAR_CONNECTOR_URL, "/calendar/event", payload)
            return {
                "status": "sent_to_mcp",
                "provider": "mcp-calendar",
                "result": data,
            }
        except Exception as exc:
            logger.exception("MCP calendar connector unavailable: %s", exc)
            return _local_calendar_proposal(req, error=str(exc))

    return _local_calendar_proposal(req)


def _local_email_draft(req: McpEmailDraftRequest, error: str | None = None) -> dict[str, Any]:
    return {
        "status": "draft_generated",
        "provider": "local-draft",
        "connected": False,
        "error": error,
        "draft": {
            "to": req.to,
            "subject": req.subject.strip(),
            "body": req.body.strip(),
            "context": req.context,
        },
        "next_step": "Configurer MCP_EMAIL_CONNECTOR_URL pour envoyer ce brouillon vers un connecteur email.",
    }


def _local_calendar_proposal(req: McpCalendarEventRequest, error: str | None = None) -> dict[str, Any]:
    return {
        "status": "event_proposal_generated",
        "provider": "local-proposal",
        "connected": False,
        "error": error,
        "event": {
            "title": req.title.strip(),
            "start": req.start,
            "end": req.end,
            "attendees": req.attendees,
            "description": req.description,
            "timezone": req.timezone,
        },
        "next_step": "Configurer MCP_CALENDAR_CONNECTOR_URL pour creer cet evenement dans un agenda.",
    }

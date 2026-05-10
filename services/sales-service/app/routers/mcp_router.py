import logging

from fastapi import APIRouter

from app.mcp_bridge import create_calendar_event, create_email_draft, get_mcp_status
from app.schemas import McpCalendarEventRequest, McpEmailDraftRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sales/ai/mcp", tags=["MCP Email & Agenda"])


@router.get("/status")
def mcp_status():
    """Etat des connecteurs MCP email et agenda."""
    return get_mcp_status()


@router.post("/email/draft")
async def email_draft(req: McpEmailDraftRequest):
    """
    Prepare un brouillon email.
    Si MCP_EMAIL_CONNECTOR_URL est configure, la requete est transmise au connecteur MCP.
    """
    return await create_email_draft(req)


@router.post("/calendar/event")
async def calendar_event(req: McpCalendarEventRequest):
    """
    Prepare une proposition d'evenement agenda.
    Si MCP_CALENDAR_CONNECTOR_URL est configure, la requete est transmise au connecteur MCP.
    """
    return await create_calendar_event(req)

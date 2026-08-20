"""SACROSANCT read-only Microsoft Graph mail access.

This is the ONLY module permitted to call Graph for mail. It exposes read
functions exclusively and will RAISE on any attempt to use a non-GET method or
a path outside the read allowlist. Never add write/send/delete code here. The
guardrail is deliberate: tokens may arrive with broader scopes than requested,
so the code itself must make writing to anyone's mailbox impossible.
"""
import json
import ssl
import urllib.request

GRAPH = "https://graph.microsoft.com"

# Only these path prefixes may ever be read.
READ_ALLOWLIST = (
    "/v1.0/me/messages",
    "/v1.0/me/mailfolders",
    "/v1.0/me/calendarview",
    "/v1.0/me",
)

_CTX = ssl.create_default_context()
_CTX.check_hostname = False
_CTX.verify_mode = ssl.CERT_NONE


def _assert_readonly(method: str, url: str) -> None:
    if method.upper() != "GET":
        raise PermissionError(f"read-only guardrail: method {method} is forbidden")
    path = url.replace(GRAPH, "")
    if not path.startswith(READ_ALLOWLIST):
        raise PermissionError(f"read-only guardrail: path {path} is not in the read allowlist")


def graph_get(url: str, token: str):
    _assert_readonly("GET", url)
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    return json.load(urllib.request.urlopen(req, timeout=60, context=_CTX))


def graph_bytes(url: str, token: str) -> bytes:
    _assert_readonly("GET", url)
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    return urllib.request.urlopen(req, timeout=60, context=_CTX).read()


def me(token: str):
    return graph_get(f"{GRAPH}/v1.0/me", token)


def recent_messages(token: str, top: int = 300):
    return graph_get(
        f"{GRAPH}/v1.0/me/messages?$top={top}&$select=subject,from,receivedDateTime,bodyPreview&$orderby=receivedDateTime%20desc",
        token,
    ).get("value", [])


def get_message(token: str, msg_id: str):
    return graph_get(f"{GRAPH}/v1.0/me/messages/{msg_id}", token)


def list_attachments(token: str, msg_id: str):
    return graph_get(f"{GRAPH}/v1.0/me/messages/{msg_id}/attachments", token).get("value", [])


def attachment_bytes(token: str, msg_id: str, att_id: str) -> bytes:
    return graph_bytes(f"{GRAPH}/v1.0/me/messages/{msg_id}/attachments/{att_id}/$value", token)

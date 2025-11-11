import os, http.client, json, base64
from typing import Dict, Any

# === Stub para IDOK/FirmaYa ===
BASE = os.environ.get("IDOK_BASE_URL", "").rstrip('/')
API_KEY = os.environ.get("IDOK_API_KEY", "")
PUBLIC_BASE = os.environ.get("PUBLIC_BASE_URL", "")

def _http(method, path, body=None, headers=None):
    assert BASE, "Configura IDOK_BASE_URL"
    if BASE.startswith("https://"):
        host = BASE.replace("https://", "")
        conn = http.client.HTTPSConnection(host)
    else:
        host = BASE.replace("http://", "")
        conn = http.client.HTTPConnection(host)
    payload = json.dumps(body) if isinstance(body, dict) else body
    base_headers = {"Content-Type":"application/json","X-API-Key": API_KEY}
    if headers: base_headers.update(headers)
    conn.request(method, path, payload, base_headers)
    resp = conn.getresponse()
    data = resp.read()
    return resp.status, resp.reason, data

def create_envelope(poder: Dict[str, Any]) -> Dict[str, Any]:
    callback = f"{PUBLIC_BASE}/webhooks/idok"
    envelope = {
        "title": "Poder simple traspaso de derechos de cultivo",
        "callback_url": callback,
        "signers": [
            {"name": poder["data"]["cedente_nombre"], "email": poder["data"]["cedente_email"], "rut": poder["data"]["cedente_rut"], "role": "Cedente"},
            {"name": poder["data"]["cesionario_nombre"], "email": poder["data"]["cesionario_email"], "rut": poder["data"]["cesionario_rut"], "role": "Cesionario"},
        ],
        "document": {
            "filename": "poder_cultivo.pdf",
            "content_base64": poder["pdf_base64"],
            "mime": "application/pdf"
        }
    }
    # Path ficticio para ilustrar:
    path = "/api/v1/envelopes"
    status, reason, data = _http("POST", path, envelope)
    return {"status": status, "reason": reason, "raw": data.decode("utf-8","ignore")}

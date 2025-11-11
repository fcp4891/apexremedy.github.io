import os, http.client, json, base64
from typing import Dict, Any

# === Este es un stub. Debes completar con la documentación oficial de e-certchile/ECERT ===
# Flujo típico:
# 1) Autenticación OAuth2 / API key según proveedor.
# 2) Crear "sobre/envelope" con documento PDF y firmantes (RUN/RUT, email).
# 3) Recibir URL/redirección para firma o enviar OTP según modalidad.
# 4) Webhook/callback notifica resultado (firmado/rechazado).
# 5) Descargar PDF firmado + evidencia.
#
# Nota: Algunos integran “portal de firmas” donde se sube el PDF y se listan firmantes; la API devuelve un link.
#       Otros permiten firma no presencial autenticando con Clave Única o biometría.
#
# Variables de entorno:
BASE = os.environ.get("ECERT_BASE_URL", "").rstrip('/')
CLIENT_ID = os.environ.get("ECERT_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("ECERT_CLIENT_SECRET", "")
TENANT = os.environ.get("ECERT_TENANT", "")
PUBLIC_BASE = os.environ.get("PUBLIC_BASE_URL", "")

def _http(method, path, body=None, headers=None):
    assert BASE, "Configura ECERT_BASE_URL"
    if BASE.startswith("https://"):
        host = BASE.replace("https://", "")
        conn = http.client.HTTPSConnection(host)
    else:
        host = BASE.replace("http://", "")
        conn = http.client.HTTPConnection(host)
    payload = json.dumps(body) if isinstance(body, dict) else body
    conn.request(method, path, payload, headers or {})
    resp = conn.getresponse()
    data = resp.read()
    return resp.status, resp.reason, data

def create_envelope(poder: Dict[str, Any]) -> Dict[str, Any]:
    # Construye payload estándar.
    # IMPORTANTE: Reemplaza los campos de acuerdo a la API real del proveedor.
    callback = f"{PUBLIC_BASE}/webhooks/ecert"
    envelope = {
        "name": "Poder simple traspaso de derechos de cultivo",
        "callback_url": callback,
        "signers": [
            {"name": poder["data"]["cedente_nombre"], "email": poder["data"]["cedente_email"], "rut": poder["data"]["cedente_rut"], "role": "Cedente"},
            {"name": poder["data"]["cesionario_nombre"], "email": poder["data"]["cesionario_email"], "rut": poder["data"]["cesionario_rut"], "role": "Cesionario"},
        ],
        "document": {
            "filename": "poder_cultivo.pdf",
            "content_base64": poder["pdf_base64"],  # PDF generado server-side
            "mime": "application/pdf"
        }
    }
    # Ejemplo de path ficticio:
    path = "/v1/envelopes"
    status, reason, data = _http("POST", path, envelope, headers={"Content-Type":"application/json","Authorization":"Bearer REEMPLAZAR_TOKEN"})
    return {"status": status, "reason": reason, "raw": data.decode("utf-8", "ignore")}

import os, base64, io, datetime
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jinja2 import Environment, FileSystemLoader, select_autoescape

from models import PoderCreate
import storage
from provider_clients import ecert as ecert_client
from provider_clients import idok as idok_client

storage.init_db()

app = FastAPI(title="Poder Cultivo – Ley 20.000 (CL)")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Jinja env
env = Environment(
    loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "templates")),
    autoescape=select_autoescape()
)

def render_html(data: dict) -> str:
    t = env.get_template("poder.html")
    hoy = datetime.datetime.now().strftime("%d-%m-%Y")
    d = data.copy()
    d["hoy"] = hoy
    if d.get("vigencia") == "indefinido":
        d["vigencia_texto"] = "indefinida"
    else:
        fi = d.get("fecha_inicio")
        ft = d.get("fecha_termino") or "________"
        d["vigencia_texto"] = f"desde {fi} hasta {ft}"
    return t.render(**d)

@app.post("/api/poder", response_model=dict)
async def create_poder(payload: PoderCreate):
    pid = storage.insert_poder(payload.model_dump())
    return {"id": pid, "status": "draft"}

class ProviderIn(BaseModel):
    provider: str  # "ecert" | "idok"

@app.post("/api/poder/{pid}/pdf", response_model=dict)
async def generate_pdf(pid: int):
    poder = storage.get_poder(pid)
    if not poder: raise HTTPException(404, "Poder no existe")
    html = render_html(poder["data"])
    # Para producción: usar WeasyPrint o similar. Aquí devolvemos base64 de HTML como marcador.
    pdf_b64 = base64.b64encode(html.encode("utf-8")).decode("utf-8")
    return {"id": pid, "pdf_base64_html": pdf_b64}

@app.post("/api/poder/{pid}/send-to-sign", response_model=dict)
async def send_to_sign(pid: int, provider_in: ProviderIn):
    poder = storage.get_poder(pid)
    if not poder: raise HTTPException(404, "Poder no existe")

    # Genera documento (en producción: PDF real)
    html = render_html(poder["data"])
    # Marcardor: en producción conviértelo a PDF con WeasyPrint y codifica base64
    # from weasyprint import HTML; pdf_bytes = HTML(string=html).write_pdf()
    pdf_bytes = html.encode("utf-8")  # placeholder
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    poder["pdf_base64"] = pdf_b64

    if provider_in.provider == "ecert":
        result = ecert_client.create_envelope(poder)
        storage.update_poder(pid, status="sent_to_sign", provider="ecert", provider_envelope_id="TBD")
    elif provider_in.provider == "idok":
        result = idok_client.create_envelope(poder)
        storage.update_poder(pid, status="sent_to_sign", provider="idok", provider_envelope_id="TBD")
    else:
        raise HTTPException(400, "Proveedor no soportado")

    return {"id": pid, "provider": provider_in.provider, "provider_response": result}

@app.post("/webhooks/ecert")
async def webhook_ecert(request: Request):
    body = await request.json()
    # Validar firma con secreto ECERT_WEBHOOK_SECRET si aplica
    # Actualizar estado según body
    # storage.update_poder(pid, status="signed", provider_envelope_id=...)
    return JSONResponse({"ok": True})

@app.post("/webhooks/idok")
async def webhook_idok(request: Request):
    body = await request.json()
    # Validar firma con secreto IDOK_WEBHOOK_SECRET
    return JSONResponse({"ok": True})

@app.get("/", response_class=HTMLResponse)
async def root():
    return "<h3>Poder Cultivo – API</h3><p>POST /api/poder, /api/poder/{id}/send-to-sign</p>"

# Poder Cultivo – Firma Online (Chile)

Flujo completo para generar y firmar un **Poder simple de traspaso de derechos de cultivo** (Ley 20.000) con integración a proveedor chileno de firma electrónica (stubs para **E-certchile (ECERT)** e **IDOK/FirmaYa**).

## Estructura
- `app.py`: FastAPI con endpoints para crear poder, generar documento y enviarlo a firma.
- `models.py`, `storage.py`: modelos y persistencia en SQLite.
- `templates/poder.html`: plantilla de documento (Jinja2).
- `provider_clients/ecert.py`, `provider_clients/idok.py`: clientes de proveedor (stubs con paths de ejemplo para que reemplaces con la documentación real del proveedor).
- `requirements.txt`: dependencias mínimas.
- `.env.example`: variables de entorno.

## Cómo correr
```bash
python -m venv .venv && . .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

## Endpoints
1. **Crear poder (draft)**
   ```http
   POST /api/poder
   Content-Type: application/json
   ```
   Body: `PoderCreate` (ver `models.py`). Respuesta: `{ "id": <int>, "status": "draft" }`

2. **Generar PDF (base64 placeholder)**
   ```http
   POST /api/poder/{id}/pdf
   ```

3. **Enviar a firma**
   ```http
   POST /api/poder/{id}/send-to-sign
   {
     "provider": "ecert" | "idok"
   }
   ```

4. **Webhooks de proveedor**
   - `POST /webhooks/ecert`
   - `POST /webhooks/idok`

## Integración con proveedor
Cada proveedor tiene APIs particulares (OAuth2, API keys, payloads, evidencias). En los stubs (`provider_clients/*.py`) encontrarás la estructura típica: crear un envelope con el PDF (base64), definir firmantes (nombre, email, RUT) y configurar `callback_url` a tu backend.

### Acreditación legal
La **firma electrónica avanzada** debe provenir de un **prestador acreditado en Chile** (Ley 19.799). Ver:
- Lista de prestadores / TSL (Subsecretaría de Economía): CL-TSL.pdf (2024).

## Producción
- Sustituye URL base y credenciales por las del proveedor.
- Activa HTTPS y dominio público para callbacks.
- Convierte HTML a **PDF real** (WeasyPrint).
- Firma avanzada: algunos proveedores permiten autenticación con **ClaveÚnica** o biometría.
- Guarda PDF firmado y evidencia técnica.


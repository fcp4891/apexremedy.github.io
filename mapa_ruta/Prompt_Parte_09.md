✅ Prompt Parte 9: Observabilidad & DevOps (Docker, Compose, CI/CD, Release, Backups, Migraciones, Entornos, Fly.io/Render)
Actúa como DevOps Lead. Entrega una solución completa de Observabilidad & DevOps para el e-commerce (Partes 1–8). Produce archivos, scripts y documentación operativa. Usa prácticas productivas, imágenes slim, y usuarios no-root.

## 0) Alcance técnico
Stack:
- Backend: FastAPI + Uvicorn (Python 3.11) + SQLAlchemy/SQLModel + Alembic.
- Frontend: Vue 3 + Vite.
- DB: Postgres (prod/dev); SQLite solo en tests locales rápidos.
- Cache/cola (opcional): Redis (para rate-limit, jobs o sesiones).
- Storage: S3 compatible (MinIO local, S3 prod) para imágenes y documentos.
- Observabilidad: logs JSON, Prometheus metrics (o equivalente) y tracing (OTLP opcional).

Entregables:
- `Dockerfile` (backend) multi-stage + non-root + healthcheck.
- `Dockerfile` (frontend) multi-stage (build + Nginx) + headers seguros.
- `docker-compose.yml` (dev) con backend, frontend, postgres, redis, minio, adminer.
- `Makefile` con comandos comunes.
- `alembic/` configurado, con script de migraciones.
- `scripts/` para backup/restore DB, seed, migrate.
- CI/CD GitHub Actions (`.github/workflows/*.yml`) para: test, build, lint, migrate, deploy (Fly.io/Render).
- Infra de despliegue:
  - Fly.io: `fly.toml`, comandos `flyctl`.
  - Render.com: `render.yaml` y variables de entorno.

## 1) Docker (multi-stage) y seguridad
### Backend `Dockerfile`
- Multi-stage: `builder` (poetry/pip wheel cache) → `runtime` (python:3.11-slim).
- Instala solo deps de runtime; elimina build deps.
- Crea usuario `app:app` (no-root); `WORKDIR /app`.
- Copia código, `alembic.ini`, `alembic/`.
- Expone `8080`. CMD con `uvicorn app:app --host 0.0.0.0 --port 8080`.
- `HEALTHCHECK` que llame `/healthz`.
- Variables controladas por ENV (DB, CORS, JWT, STORAGE, PAYMENT KEYS).
- Logs por stdout en JSON.

### Frontend `Dockerfile`
- Stage `build` (node:lts) → Stage `serve` (nginx:alpine).
- Copia `dist/` a `/usr/share/nginx/html`.
- Nginx conf con:
  - gzip, cache estático, `add_header` de seguridad (CSP, HSTS, X-Frame-Options=DENY, etc, ajustables por ENV).
  - 404 → index.html (SPA fallback).

## 2) Docker Compose (desarrollo local)
Archivo `docker-compose.yml`:
- Servicios:
  - `api`: build ./backend; env_file `.env.dev`; depends_on postgres, redis, minio; ports `8080:8080`.
  - `web`: build ./frontend; ports `5173:80`.
  - `postgres`: image postgres:16; volumes persistentes; healthcheck.
  - `redis`: image redis:7.
  - `minio`: image minio/minio; consola en `9001`; bucket `uploads`.
  - `adminer`: image adminer para DB browsing; port `8081:8080`.
- Redes y volúmenes declarados.
- Comandos de init: `api` ejecuta `alembic upgrade head` al iniciar si flag ENV `AUTO_MIGRATE=true`.

## 3) Makefile (atajos)
Objetivos:
- `make up` / `make down` / `make rebuild`
- `make logs api` / `make logs web`
- `make migrate` (alembic revision + upgrade)
- `make seed` (script de seeds)
- `make backup` / `make restore`
- `make test` (backend + frontend unit tests)
- `make format` (black/isort + eslint/prettier)
- `make lint`

## 4) Migraciones (Alembic)
- `alembic.ini` + `alembic/env.py` configurados para Postgres.
- Comandos:
  - `alembic revision --autogenerate -m "init"`
  - `alembic upgrade head`
- En CI/CD: paso de **migrar antes de exponer tráfico** (ver Deploy).

## 5) Backups & Restore (Postgres)
- Script `scripts/backup_db.sh`:
  - `pg_dump -Fc` hacia `/backups/db_YYYYMMDD_HHMM.dump`.
  - Sube a S3 (awscli o s3cmd) si ENV `S3_ENABLE=true`.
- Script `scripts/restore_db.sh`:
  - `pg_restore -c` sobre base destino.
- GitHub Action (cron diario) que corre backup (si se usa runner con acceso o job en Fly/Render con cron interno).
- Política de retención: 7 diarios, 4 semanales, 3 mensuales (borrado automático).

## 6) Observabilidad
- **Health endpoints**:
  - `GET /healthz` (simple: 200 OK)
  - `GET /readyz` (verifica DB y storage)
- **Métricas**:
  - `GET /metrics` (Prometheus) con:
    - request_latency_seconds (histogram)
    - request_count_total (counter por ruta y código)
    - db_query_seconds (histogram)
    - payments_started/paid/failed por proveedor
- **Logs**:
  - JSON estructurado (time, level, traceId, method, path, status, latencyMs, userId optional).
  - No loguear secretos ni PII sensible; ofuscar tokens.
- **Tracing** (opcional):
  - OpenTelemetry OTLP exporter; instrumentar HTTP client + DB + router middlewares.
- Dashboards:
  - Describe panel Prometheus/Grafana (o vendor) con gráficos mínimos.

## 7) CI/CD (GitHub Actions)
Workflows en `.github/workflows/`:
- `ci.yml` (pull_request):
  - Node cache, Python cache.
  - `npm ci && npm run lint && npm run test` (frontend).
  - `pip install -r requirements.txt && pytest` (backend).
  - Build docker `api` y `web` (sin push).
- `deploy.yml` (push a `main` con tag semver o `release/*`):
  - Build & push imágenes a GHCR/registry (con etiquetas `sha`, `latest`, `vX.Y.Z`).
  - Correr migraciones:
    - Job `migrate`: ejecuta contenedor `api` con `alembic upgrade head` usando la **DB de prod** (credenciales vía secrets).
  - Despliegue:
    - **Fly.io**: `flyctl deploy --remote-only` con `fly.toml`.
    - **Render.com**: `render.yaml` + API de deploy o auto-deploy on push.
  - Post-deploy smoke test: `curl /healthz` y `/readyz`.

**Secrets** requeridos (Actions):
- `REGISTRY_USER`, `REGISTRY_PASSWORD` (GHCR o Docker Hub)
- `DATABASE_URL`, `JWT_SECRET`, `S3_*`, `PAYMENT_*`
- `FLY_API_TOKEN` o `RENDER_API_KEY`

## 8) Fly.io (Infra)
Archivo `fly.toml` (para API y WEB, o apps separadas):
- Puertos: API `8080`, WEB `80`.
- Healthchecks:
  - TCP + HTTP (path `/healthz`), grace/interval/timeouts sensatos.
- Volúmenes (si se usa en runtime; idealmente DB gestionada fuera).
- Secrets vía `fly secrets set KEY=...`.
- Escalado:
  - `[[services.autoscale]]` cpu/mem y min/max máquinas.
- Deploy blue-green (estrategia **canary** mínima):
  - Primero levantar nueva release en una máquina secundaria,
  - Test de `/readyz`,
  - Shift tráfico gradualmente.

## 9) Render.com (Infra)
Archivo `render.yaml`:
- Servicios:
  - `api`: docker; envVars (DATABASE_URL, JWT_SECRET, CORS_ORIGINS, etc.); healthCheckPath `/healthz`.
  - `web`: static site (si usas Nginx en contenedor, config como service docker).
  - `postgres`: managed (opción Render) o externo.
- Deploy hooks y **preDeployCommand** para `alembic upgrade head`.

## 10) Gestión de entornos
- `.env.example` con:
  - `ENV=dev|staging|prod`
  - `DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
  - `JWT_SECRET`, `CORS_ORIGINS`, `RATE_LIMITS`
  - `PAYMENT_WEBPAY_*`, `PAYMENT_FLOW_*`, `PAYMENT_MP_*`
  - `PUBLIC_BASE_URL`, `FRONTEND_URL`
- `.env.dev`, `.env.staging`, `.env.prod` (no subir prod al repo).
- Config por entorno:
  - logging level, CORS, CSP, cookies, cache headers.

## 11) Estrategia de despliegue, release & rollback
- **Release checklist**:
  1) CI verde (tests, lint, build).
  2) Migraciones generadas y revisadas.
  3) Backup DB realizado en último <24h.
  4) Variables de entorno y secrets set.
  5) Healthchecks y métricas visibles.
- **Despliegue**:
  - Correr `alembic upgrade head` antes de recibir tráfico.
  - Activar nueva versión en 1 instancia, validar `/readyz`, luego escalar.
- **Rollback**:
  - Mantener imagen anterior etiquetada (`vX.Y.Z-1`).
  - `flyctl deploy --image <prev>` o `render rollback`.
  - Si migraciones rompieron compatibilidad: tener `down` script de Alembic (o migraciones `expand/contract`).
- **Feature flags** (opcional):
  - Toggle de features sensibles (pagos, medicinal) por ENV o tabla `feature_flags`.

## 12) Hardening y performance
- `uvicorn` con `--workers` acorde a CPU; gunicorn+uvicorn workers opcional.
- Limitar tamaño de requests, timeout de body, keepalive tuning.
- HSTS, CSP y headers de seguridad en Nginx (frontend).
- Imágenes Docker con `--chown=app:app`, no copiar `.git`, `.env*`.
- Cache de dependencias (pip cache dir / npm ci cache) en CI para builds rápidos.

## 13) Documentación operativa
- `DEPLOY.md`: pasos locales → staging → prod (Fly/Render).
- `RUNBOOK.md`: cómo responder a:
  - Pico de 5xx, pagos fallando (>X% en 15 min), DB sin espacio, latencia > p95 objetivo.
- `BACKUP_POLICY.md`: retención y restauración.
- `OBSERVABILITY.md`: cómo ver logs, métricas, tracing.
- `SECURITY.md`: (de Parte 8) referencia cruzada.

## 14) Validación final (smoke tests)
- Script `scripts/smoke.sh`:
  - `curl /healthz` (200)
  - `curl /readyz` (200 y checks de DB/S3)
  - `curl /metrics` (existe métrica http_requests_total)
- GitHub Action post-deploy corre `scripts/smoke.sh` contra PROD.

## 15) Entregables (archivos a generar)
- `/backend/Dockerfile`
- `/frontend/Dockerfile`
- `/docker-compose.yml`
- `/Makefile`
- `/alembic/*` + `alembic.ini`
- `/scripts/backup_db.sh`, `restore_db.sh`, `seed.sh`, `smoke.sh`
- `/.github/workflows/ci.yml`, `deploy.yml`
- `/fly.toml` y/o `/render.yaml`
- `/DEPLOY.md`, `/RUNBOOK.md`, `/BACKUP_POLICY.md`, `/OBSERVABILITY.md`, `/SECURITY.md`
# Apexremedy - E-commerce Platform

Plataforma de e-commerce para productos especializados con sistema de administración integrado.

## 🚀 Características

- **Frontend**: Interfaz moderna y responsive con Tailwind CSS
- **Backend**: API REST con Node.js y Express
- **Base de Datos**: SQLite con Sequelize ORM
- **Autenticación**: Sistema de login con JWT
- **Carrito de Compras**: Gestión de productos y pedidos
- **Panel de Administración**: Gestión completa de productos, usuarios y pedidos

## 📁 Estructura del Proyecto

```
├── frontend/          # Frontend estático (GitHub Pages)
│   ├── admin/        # Panel de administración
│   ├── components/   # Componentes reutilizables
│   ├── js/           # Scripts JavaScript
│   └── style/        # Estilos CSS
├── backend/          # API REST (no se despliega en GitHub Pages)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   └── database/
└── package.json
```

## 🌐 Despliegue en GitHub Pages

Este proyecto está configurado para desplegarse en GitHub Pages desde la carpeta `frontend/`.

### Paso 1: Subir el código a GitHub

```bash
# Si aún no has hecho push, ejecuta:
git push -u origin main

# Si te pide autenticación, usa un Personal Access Token:
# 1. Ve a GitHub > Settings > Developer settings > Personal access tokens
# 2. Crea un token con permisos de 'repo'
# 3. Úsalo como contraseña cuando Git lo solicite
```

### Paso 2: Configurar GitHub Pages

**Opción A: Usando GitHub Actions (Recomendado)**
1. Ve a **Settings** > **Pages** en tu repositorio
2. En **Source**, selecciona **GitHub Actions**
3. El workflow `.github/workflows/pages.yml` se ejecutará automáticamente

**Opción B: Manual**
1. Ve a **Settings** > **Pages** en tu repositorio
2. En **Source**, selecciona la rama `main`
3. En **Folder**, selecciona `/frontend`
4. Guarda los cambios

### URL de GitHub Pages

Tu sitio estará disponible en:
```
https://fcp4891.github.io/apexremedy.github.io/
```

**Nota**: El despliegue puede tardar unos minutos después del push.

## 📝 Notas Importantes

- El **backend** no se despliega en GitHub Pages (requiere servidor Node.js)
- La **base de datos** está en `backend/` y no se incluye en el repositorio
- Los archivos de configuración del backend deben mantenerse locales

## 🛠️ Desarrollo Local

### Frontend
```bash
cd frontend
# Abrir index.html en navegador o usar servidor local
python -m http.server 5500
```

### Backend
```bash
cd backend
npm install
npm start
```

## 📄 Licencia

Todos los derechos reservados - Apexremedy © 2024


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

### Configuración de GitHub Pages

1. Ve a **Settings** > **Pages** en tu repositorio
2. En **Source**, selecciona la rama `main` (o `master`)
3. En **Folder**, selecciona `/frontend`
4. Guarda los cambios

### URL de GitHub Pages

Tu sitio estará disponible en:
```
https://fcp4891.github.io/apexremedy.github.io/
```

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


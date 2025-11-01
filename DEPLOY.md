# Guía de Despliegue en GitHub Pages

## ⚠️ IMPORTANTE: Autenticación Requerida

Para hacer el push inicial, necesitas autenticarte con GitHub usando un **Personal Access Token**.

## Paso 1: Crear Personal Access Token

1. Ve a GitHub: https://github.com/settings/tokens
2. Click en **"Generate new token"** → **"Generate new token (classic)"**
3. Configura:
   - **Note**: "Apexremedy Deployment"
   - **Expiration**: Elige una fecha (o "No expiration")
   - **Scopes**: Marca `repo` (full control)
4. Click en **"Generate token"**
5. **COPIA EL TOKEN** (solo se muestra una vez)

## Paso 2: Hacer Push

Ejecuta en tu terminal:

```bash
git push -u origin main
```

Cuando te pida:
- **Username**: `fcp4891`
- **Password**: Pega el Personal Access Token (NO tu contraseña de GitHub)

## Paso 3: Configurar GitHub Pages

Después del push exitoso:

1. Ve a: https://github.com/fcp4891/apexremedy.github.io/settings/pages
2. En **"Source"**, selecciona: **"GitHub Actions"**
3. Guarda los cambios

## Paso 4: Verificar Despliegue

1. Ve a la pestaña **"Actions"** en tu repositorio
2. Verás el workflow "Deploy to GitHub Pages" ejecutándose
3. Cuando termine (✓ verde), tu sitio estará disponible en:
   ```
   https://fcp4891.github.io/apexremedy.github.io/
   ```

## Alternativa: Push Manual con Token en URL

Si prefieres, puedes hacer el push directamente con el token en la URL:

```bash
git remote set-url origin https://fcp4891:TU_TOKEN_AQUI@github.com/fcp4891/apexremedy.github.io.git
git push -u origin main
```

**⚠️ Nota**: Reemplaza `TU_TOKEN_AQUI` con tu Personal Access Token.

## Solución de Problemas

### Error: "Authentication failed"
- Verifica que el token tenga permisos de `repo`
- Asegúrate de usar el token como contraseña, NO tu contraseña de GitHub

### Error: "Repository not found"
- Verifica que el repositorio `apexremedy.github.io` exista en GitHub
- Verifica que tengas permisos de escritura

### El sitio no se despliega
- Verifica que el workflow se haya ejecutado en la pestaña "Actions"
- Revisa los logs del workflow para ver errores
- Verifica que la carpeta `/frontend` contenga los archivos HTML


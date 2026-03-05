# Configuración Meta (Facebook e Instagram)

Guía para publicar cursos en Facebook e Instagram desde el CRM.

---

## Errores frecuentes

| Error | Causa |
|-------|-------|
| `pages_manage_posts are not available` | Permiso no añadido en la app o requiere App Review |
| `Application does not have permission (#10)` | Instagram: permiso faltante, cuenta mal conectada o token incorrecto |
| `META_PAGE_ACCESS_TOKEN requerido` | Variable no configurada (o typo: `ACCES` → `ACCESS`) |

---

## Requisitos previos

1. **Página de Facebook** creada y activa
2. **Cuenta Instagram Business** vinculada a esa página
3. **App en Meta for Developers** ([developers.facebook.com](https://developers.facebook.com))

---

## Paso 1: Productos y permisos en la app

En el [Dashboard de tu app](https://developers.facebook.com/apps/):

1. Añade el producto **Facebook Login** si no lo tienes
2. Añade **Instagram Graph API** (o "Instagram" en productos)
3. Ve a **App Review** → **Permissions and Features**
4. Busca y **solicita** (Request) estos permisos:

   | Permiso | Uso |
   |---------|-----|
   | `pages_manage_posts` | Publicar en la página |
   | `pages_read_engagement` | Leer engagement de la página |
   | `instagram_basic` | Información básica de Instagram |
   | `instagram_content_publish` | Publicar en el feed de Instagram |

5. Para cada permiso:
   - Si ofrece **Standard Access**: actívalo (sin App Review para uso propio)
   - Si solo ofrece **Advanced Access**: necesitarás App Review

---

## Paso 2: Modo de la app

- **Development**: solo tú (y roles de la app) puedes usar la app
- **Live**: cualquier usuario puede usarla (requiere App Review si pides Advanced Access)

Si la app está en **Development** y es **solo para tu negocio**, Standard Access suele ser suficiente. Si Meta pide App Review para `pages_manage_posts`, tendrás que pasar el proceso de revisión.

---

## Paso 3: Obtener Page Access Token

1. Entra en [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Selecciona **tu app** en el desplegable superior
3. En **"User or Page"** (o similar), elige tu **Página de Facebook**
4. Haz clic en **"Add a Permission"**
5. Marca: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
6. Haz clic en **"Generate Access Token"** y autoriza
7. Copia el token generado → es tu **Page Access Token** (no caduca si la app está en Live o si usas flujo correcto)

Para un token **permanente** en producción:
- Genera un User Access Token de larga duración
- Llama a `GET /me/accounts?fields=access_token` para obtener el Page Access Token de cada página

---

## Paso 4: IDs necesarios

### META_PAGE_ID
- En tu página de Facebook: **Configuración** → **Información general** → **ID de página**
- O en Graph API Explorer: `GET /me/accounts` con tu token

### META_INSTAGRAM_ID
- La cuenta Instagram debe estar **vinculada** a la página: Página → **Configuración** → **Instagram**
- En la app: **Instagram Graph API** → configuración; ahí verás el ID de la cuenta
- O: `GET /{page-id}?fields=instagram_business_account` con el Page Access Token

---

## Paso 5: Variables en Vercel (.env)

```
META_PAGE_ACCESS_TOKEN=EAANLzaZA3cckBQ...
META_PAGE_ID=123456789012345
META_INSTAGRAM_ID=17841475444215321
```

⚠️ Nombre correcto: `META_PAGE_ACCESS_TOKEN` (doble S en ACCESS).

---

## Si necesitas App Review

Meta puede exigir App Review para `pages_manage_posts` y `instagram_content_publish` según el tipo de app.

Necesitarás:
1. **Business Verification** (verificación de negocio) si aplica
2. **Política de privacidad** pública
3. **Video/screencast** mostrando cómo se usa la publicación en redes
4. Instrucciones para que un revisor de Meta pruebe la app

Documentación: [App Review - Meta for Developers](https://developers.facebook.com/docs/app-review)

---

## Orden de publicación (Instagram necesita imagen)

1. **Publicar el curso en WordPress** primero (con imagen destacada generada por Gemini)
2. **Después** publicar en Facebook e Instagram

Si publicas en redes antes de WordPress, no habrá imagen y Instagram fallará con "requiere imagen".

---

## Curls para configuración desde terminal

### Prerrequisitos

- **User Access Token** de corta duración: obténlo en [Graph API Explorer](https://developers.facebook.com/tools/explorer/) (Add Permission → marcar `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish` → Generate Access Token)
- **App ID** y **App Secret**: en tu app → Configuración → Básica

Sustituye en los comandos:
- `TU_USER_TOKEN` = token del Graph API Explorer
- `TU_APP_ID` = ID de la app
- `TU_APP_SECRET` = Clave secreta de la app

---

### 1. Intercambiar token corto por token largo (60 días)

```bash
curl -X GET "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=TU_APP_ID&client_secret=TU_APP_SECRET&fb_exchange_token=TU_USER_TOKEN"
```

---

### 2. Obtener Page Access Token e IDs de páginas

```bash
curl -X GET "https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,tasks&access_token=TU_USER_TOKEN"
```

Respuesta de ejemplo:
```json
{"data":[{"id":"123456789","name":"Mi Página","access_token":"EAANL...","tasks":["CREATE_CONTENT","MANAGE",...]}]}
```

- `id` → **META_PAGE_ID**
- `access_token` → **META_PAGE_ACCESS_TOKEN** (Page token, no caduca mientras la app siga autorizada)

---

### 3. Obtener META_INSTAGRAM_ID desde el Page ID

```bash
curl -X GET "https://graph.facebook.com/v21.0/TU_PAGE_ID?fields=instagram_business_account&access_token=TU_PAGE_ACCESS_TOKEN"
```

Respuesta de ejemplo:
```json
{"instagram_business_account":{"id":"17841475444215321"}}
```

`instagram_business_account.id` → **META_INSTAGRAM_ID**

---

### 4. Verificar permisos del token (debug)

```bash
curl -X GET "https://graph.facebook.com/v21.0/debug_token?input_token=TU_TOKEN&access_token=TU_APP_ID|TU_APP_SECRET"
```

(En `access_token` usa literalmente `APP_ID|APP_SECRET` como App Access Token)

La respuesta incluye `scopes` con los permisos efectivos y `expires_at` con la caducidad.

---

### 5. Todo en secuencia (ejemplo)

```bash
# Variables
USER_TOKEN="tu_user_token_del_explorer"
APP_ID="123456789"
APP_SECRET="abc123..."

# 1. Token largo (opcional)
LONG_TOKEN=$(curl -s "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${USER_TOKEN}" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# 2. Páginas (usa LONG_TOKEN o USER_TOKEN)
curl -s "https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${LONG_TOKEN}"

# 3. Instagram (usa el PAGE_ID y PAGE_ACCESS_TOKEN del paso 2)
curl -s "https://graph.facebook.com/v21.0/PAGE_ID?fields=instagram_business_account&access_token=PAGE_ACCESS_TOKEN"

# 4. Debug
curl -s "https://graph.facebook.com/v21.0/debug_token?input_token=PAGE_ACCESS_TOKEN&access_token=${APP_ID}|${APP_SECRET}"
```

---

**Nota:** Los permisos `pages_manage_posts`, `instagram_content_publish`, etc. se configuran en el **Dashboard de la app** (App Review → Permissions and Features), no via API. Los curls de arriba sirven para obtener tokens e IDs una vez la app tenga los permisos solicitados.

---

## Recursos

- [Posts - Facebook Pages API](https://developers.facebook.com/docs/pages-api/posts/)
- [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- [App Review - Instagram Platform](https://developers.facebook.com/docs/instagram-platform/app-review)

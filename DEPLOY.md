# Deploy en Vercel

## Build local (para validar)

Crear `.env.local` con valores placeholder para que `npm run build` funcione sin credenciales reales:

```
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_SERVICE_ROLE_KEY=placeholder
```

## Requisitos previos

1. Cuenta Vercel
2. Repo Git (GitHub/GitLab/Bitbucket)
3. Supabase configurado con tabla `courses`
4. Credenciales de OpenAI, WordPress y Hotmart

## Pasos

### 1. Supabase

```bash
# En Supabase SQL Editor, ejecutar:
# supabase/migrations/001_create_courses_table.sql
```

O con Supabase CLI:
```bash
supabase db push
```

### 2. Variables de entorno en Vercel

En **Project Settings → Environment Variables** añadir:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) | All |
| `OPENAI_API_KEY` | API key de OpenAI | All |
| `WORDPRESS_URL` | https://tudominio.com | All |
| `WORDPRESS_USER` | Usuario WP | All |
| `WORDPRESS_APP_PASSWORD` | Application Password | All |
| `HOTMART_CLIENT_ID` | Client ID de Hotmart | All |
| `HOTMART_CLIENT_SECRET` | Client Secret de Hotmart | All |

### 3. Deploy

```bash
# Conectar repo a Vercel
vercel link

# Deploy producción
vercel --prod
```

O conectar el repo desde el dashboard de Vercel (Import Git Repository).

### 4. WordPress

- Crear Application Password: Usuarios → Tu perfil → Application Passwords
- Tutor LMS: El CPT `courses` se crea vía `/wp-json/wp/v2/courses` (REST estándar). Tutor LMS Free es solo lectura; para creación automática puede requerir Tutor Pro o verificar que el CPT exponga `edit` en `show_in_rest`.
- Permalinks: Settings → Permalinks → Post name

### 5. Hotmart

- Crear app en https://developers.hotmart.com
- OAuth2 client_credentials
- Si el endpoint de productos difiere, usar `HOTMART_PRODUCTS_URL`

### 6. Verificación

```bash
# Generar curso
curl -X POST https://tu-app.vercel.app/api/generate-course \
  -H "Content-Type: application/json" \
  -d '{"topic":"React","level":"beginner","avatar":"Desarrollador junior","focus":"Hooks"}'

# Listar cursos
curl https://tu-app.vercel.app/api/courses
```

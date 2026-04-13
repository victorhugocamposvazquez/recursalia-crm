# Deploy en Vercel

## Build local (para validar)

Crear `.env.local` con valores placeholder para que `npm run build` funcione sin credenciales reales:

```
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
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
# En Supabase SQL Editor, ejecutar en orden:
# supabase/migrations/001_create_courses_table.sql
# supabase/migrations/002_public_site_blog_reviews.sql
```

La migración **002** añade: `public_slug`, reseñas en `course_reviews`, blog `blog_posts`, bucket público `course_media`, y **RLS** para que el anon key solo lea cursos publicados y posts publicados. El panel sigue usando la **service role** (sin restricción RLS).

Para **solo Next + Supabase** (sin WordPress), en Vercel define `WORDPRESS_PUBLISH_ENABLED=false` y no hace falta `WORDPRESS_*` para publicar cursos en la web.

Variable recomendada: `NEXT_PUBLIC_SITE_URL` (origen canónico, p. ej. `https://tu-dominio.com`) para enlaces en artículos SEO.

O con Supabase CLI:
```bash
supabase db push
```

### 2. Configurar Auth en Supabase

- **Authentication → URL Configuration**: Añadir Site URL y Redirect URLs:
  - Site URL: `https://tu-app.vercel.app` (o `http://localhost:3000` en local)
  - Redirect: `https://tu-app.vercel.app/auth/callback`
- **Authentication → Providers**: Activar Email. Crear usuario admin desde el dashboard.

### 3. Variables de entorno en Vercel

En **Project Settings → Environment Variables** añadir:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) | All |
| `OPENAI_API_KEY` | API key de OpenAI | All |
| `WORDPRESS_URL` | https://tudominio.com | All |
| `WORDPRESS_USER` | Usuario WP | All |
| `WORDPRESS_APP_PASSWORD` | Application Password | All |
| `HOTMART_CLIENT_ID` | Client ID de Hotmart | All |
| `HOTMART_CLIENT_SECRET` | Client Secret de Hotmart | All |
| `GOOGLE_GEMINI_API_KEY` | API key de Google AI (imagen destacada) | All |

### 4. Deploy

**IMPORTANTE – Configuración de Output Directory**

En Vercel: **Settings → General → Build & Development Settings**

- **Output Directory**: dejar **vacío** (Next.js no usa `public` como salida)
- **Framework Preset**: Next.js (se auto-detecta)
- **Build Command**: `next build` (por defecto)

```bash
# Conectar repo a Vercel
vercel link

# Deploy producción
vercel --prod
```

O conectar el repo desde el dashboard de Vercel (Import Git Repository).

### 5. WordPress

- Crear Application Password: Usuarios → Tu perfil → Application Passwords
- Tutor LMS: El CPT `courses` se crea vía `/wp-json/wp/v2/courses`
- **Plugin Recursalia Course API**: Copiar `wordpress-plugin/recursalia-course-api/` a `wp-content/plugins/` y activar. Requiere Site Reviews instalado.
- Permalinks: Settings → Permalinks → Post name

### 6. Hotmart

- Crear app en https://developers.hotmart.com
- OAuth2 client_credentials
- Si el endpoint de productos difiere, usar `HOTMART_PRODUCTS_URL`

### 7. Verificación

```bash
# Generar curso
curl -X POST https://tu-app.vercel.app/api/generate-course \
  -H "Content-Type: application/json" \
  -d '{"topic":"React","level":"beginner","avatar":"Desarrollador junior","focus":"Hooks"}'

# Listar cursos
curl https://tu-app.vercel.app/api/courses
```

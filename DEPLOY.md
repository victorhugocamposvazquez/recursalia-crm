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
3. Supabase con migraciones **001**–**004** aplicadas en orden (`public_slug`, RLS, reseñas, blog; contenido editable del sitio; prioridad SEO, snapshot al publicar, `audit_log`)
4. `OPENAI_API_KEY`; Hotmart si usas checkout manual (sin API en CRM)

## Pasos

### 1. Supabase

```bash
# En Supabase SQL Editor, ejecutar en orden:
# supabase/migrations/001_create_courses_table.sql
# supabase/migrations/002_public_site_blog_reviews.sql
# supabase/migrations/003_front_site_content.sql
# supabase/migrations/004_ops_seo_audit.sql
```

La migración **002** añade: `public_slug`, reseñas en `course_reviews`, blog `blog_posts`, bucket público `course_media`, y **RLS** para que el anon key solo lea cursos publicados y posts publicados. El panel sigue usando la **service role** (sin restricción RLS).

Si al publicar ves **«Could not find the 'featured_image_url' column»**, **«Slug check failed: column courses.public_slug does not exist»**, **«Failed to clear reviews»** o **«relation course_reviews does not exist»**, la migración **002 no está aplicada** en ese proyecto (o PostgREST tiene caché vieja).

**Migración 004:** `seo_publish_priority`, `published_content_snapshot`, `publish_priority` en borradores de blog y tabla `audit_log`. Sin ella fallan PATCH de prioridad, auditorías y el orden del cron hasta ejecutar `004_ops_seo_audit.sql`.

**Qué hacer:** en Supabase → **SQL** → pega y ejecuta el archivo `supabase/migrations/002_public_site_blog_reviews.sql` completo (es idempotente: `IF NOT EXISTS`, etc.). Al final del script se ejecuta `NOTIFY pgrst, 'reload schema'` para refrescar la caché. Si tras aplicar el SQL el error de “schema cache” continúa unos minutos, en **Project Settings → API** a veces ayuda esperar o revisar la [guía oficial de refresh](https://supabase.com/docs/guides/troubleshooting/postgrest-not-recognizing-new-columns-or-functions-bd75f5).

**Gemini (imagen destacada):** si ves **429 / quota / `gemini-2.5-flash-preview-image`**, los modelos de imagen suelen exigir **plan de pago** en Google AI Studio o tienen cuota 0 en free tier. Opciones: activar facturación en el proyecto de Google Cloud vinculado, o **quitar `GOOGLE_GEMINI_API_KEY`** en Vercel para omitir la imagen (la publicación sigue). No definas `GEMINI_IMAGE_MODEL` con sufijo `-preview-` salvo que sepas que tu proyecto tiene cuota para ese modelo; el código usa por defecto `gemini-2.5-flash-image`.

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
| `NEXT_PUBLIC_SITE_URL` | Origen público canónico, p. ej. `https://tu-dominio.com` | All |
| `OPENAI_API_KEY` | API key de OpenAI | All |
| `GOOGLE_GEMINI_API_KEY` | API key de Google AI (imagen destacada, opcional) | All |
| `GEMINI_IMAGE_MODEL` | Opcional. Por defecto `gemini-2.5-flash-image` | All |
| `CRON_SECRET` | Secreto para `/api/cron/publish-posts` | All |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 (opcional; sin valor = sin script) | All |
| `TRACK_UTM_DISABLED` | `true` para no añadir UTM a enlaces | All |
| `TRACK_UTM_SOURCE` | Origen utm_source (por defecto `recursalia`) | All |

Opcionales según uso: tokens Meta (`META_*`) para redes; `CRON_SECRET` solo si activas cron de blog.

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

### 5. Hotmart (opcional)

El CRM no crea productos en Hotmart por API. Si en el futuro usas OAuth de Hotmart en otro flujo, configura las credenciales en Vercel según esa integración.

### 6. Verificación

```bash
# Generar curso
curl -X POST https://tu-app.vercel.app/api/generate-course \
  -H "Content-Type: application/json" \
  -d '{"topic":"React","level":"beginner","avatar":"Desarrollador junior","focus":"Hooks"}'

# Listar cursos
curl https://tu-app.vercel.app/api/courses
```

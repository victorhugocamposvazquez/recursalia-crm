# Hotmart y el CRM

**Hotmart no ofrece API para crear productos.** La creación es siempre manual en [app.hotmart.com](https://app.hotmart.com). El CRM facilita el flujo de forma semiautomática.

---

## Flujo en el CRM (fase actual — acceso manual)

1. **Publicar el curso** desde el CRM (landing `/cursos/[slug]`, portada Storage, reseñas Supabase cuando la IA esté configurada).
2. En la ficha del curso, genera **«Contenido del curso»** (contenido extendido por lección). Es la fuente del área alumno en `/aprender`.
3. Configura el **enlace de pago Hotmart** y guárdalo en el CRM.
4. Tras cada compra, **matricula manualmente** al alumno por email en la sección «Acceso alumnos (LMS)». El alumno debe tener cuenta en `/login`.
5. El alumno entra en **`/aprender`** → curso → lecciones, quizzes y diploma.

No hace falta configurar ninguna variable de entorno de Hotmart en el CRM en esta fase.

---

## Fase 2 — Webhook Hotmart (pendiente de implementar)

Cuando exista integración automática, el flujo previsto es:

1. **Evento** `PURCHASE_COMPLETE` (o equivalente) en un endpoint `POST /api/webhooks/hotmart`.
2. **Resolver curso** por `product_id` / código de producto / URL de pago guardada en `courses.hotmart_product_id` (hoy es URL; opcional columna `hotmart_product_code` solo para mapeo).
3. **Usuario Auth**: buscar por email del comprador; si no existe, crear usuario y perfil `student` (trigger `handle_new_user`).
4. **Matrícula**: `INSERT` en `user_courses`.
5. **Email** con magic link o instrucciones → `/login` o directamente `/aprender`.

Variables de entorno previstas:

- `HOTMART_WEBHOOK_SECRET` — validación HMAC del payload.
- `HOTMART_PRODUCT_MAP_JSON` — opcional `{ "PRODUCT_CODE": "course-uuid" }` si no basta con la URL.

Seguridad: el webhook debe usar **service role** para matricular; nunca exponer `expanded_content` en respuestas públicas.

---

## Guía oficial Hotmart

- [Cómo crear un producto en Hotmart](https://help.hotmart.com/es/article/215828518/)
- [Hotmart AI](https://hotmart.com/es/inteligencia-artificial) (sugerencias de estructura y precios)
- Documentación de webhooks: panel Hotmart → herramientas → webhook (consultar versión actual en la ayuda de Hotmart).


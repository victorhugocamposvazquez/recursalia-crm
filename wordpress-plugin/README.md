# Recursalia Course API - Plugin WordPress

Plugin para integrar el Course SaaS Generator con Site Reviews.

## Requisitos

- WordPress con Tutor LMS
- Plugin Site Reviews instalado y activo

## Instalación

1. Copiar la carpeta `recursalia-course-api` a `wp-content/plugins/`
2. Activar el plugin en WordPress → Plugins

## Endpoints

### POST /wp-json/recursalia/v1/review-category

Crear categoría de reseñas para Site Reviews.

```json
{
  "name": "Curso de Yoga profesional",
  "slug": "curso-de-yoga-profesional"
}
```

### POST /wp-json/recursalia/v1/reviews

Crear reseñas y asignarlas a un curso.

```json
{
  "assigned_post_id": 18207,
  "category_slug": "curso-de-yoga-profesional",
  "reviews": [
    {
      "title": "Ideal para mejorar",
      "content": "Comentario del alumno",
      "rating": 5,
      "author_name": "Juan Pérez",
      "date": "2024-08-23"
    }
  ]
}
```

### POST /wp-json/recursalia/v1/course-curriculum

Crear el currículo de un curso (Topics y Lessons) en Tutor LMS Pro. Usa la API de Tutor internamente, evitando problemas de autenticación 403.

```json
{
  "course_id": 18207,
  "author_id": 1,
  "topics": [
    {
      "title": "Módulo 1: Fundamentos",
      "lessons": [
        { "title": "Introducción", "content": "<p>Contenido HTML</p>" },
        { "title": "Conceptos básicos", "content": "<p>...</p>" }
      ]
    }
  ]
}
```

**Requisitos:** Tutor LMS Pro, usuario con permisos para editar cursos.

---

Requiere Application Password para autenticación.

# Hotmart y el CRM

**Hotmart no ofrece API para crear productos.** La creación es siempre manual en [app.hotmart.com](https://app.hotmart.com). El CRM facilita el flujo de forma semiautomática.

---

## Flujo en el CRM (lo más rápido posible)

1. **Publicar el curso** desde el CRM (WordPress, WooCommerce, temario, reseñas).
2. En la ficha del curso verás la sección **“Enlace de pago Hotmart”** y **“Datos para copiar en Hotmart”**.
3. **Datos para copiar**: usa los botones **Copiar** (título, descripción breve, precio) y pégalos al crear el producto en Hotmart.
4. Abre **“Crear producto en Hotmart →”** (enlace a app.hotmart.com), crea el producto y copia el **enlace de pago**.
5. Pega el enlace en el campo **“Enlace de pago Hotmart”** y pulsa **“Guardar en WordPress”**. El CRM actualiza el meta `hotmart_link` del curso en WordPress en un solo clic.

No hace falta configurar ninguna variable de entorno de Hotmart en el CRM.

---

## Guía oficial Hotmart

- [Cómo crear un producto en Hotmart](https://help.hotmart.com/es/article/215828518/)
- [Hotmart AI](https://hotmart.com/es/inteligencia-artificial) (sugerencias de estructura y precios)

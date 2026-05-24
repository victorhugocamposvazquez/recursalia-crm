-- Cierra una policy demasiado permisiva introducida en 014: cualquier usuario
-- autenticado podía leer todos los diplomas porque `share_token IS NOT NULL`
-- es cierto para toda fila (DEFAULT genera siempre un token).
-- La verificación pública por share_token se hace desde el servidor con service
-- role en /verify/[shareToken], no necesita RLS abierto.

DROP POLICY IF EXISTS "diplomas public verify by share_token" ON public.diplomas;

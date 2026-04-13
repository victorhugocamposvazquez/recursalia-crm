import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Evita que el middleware en Edge espere reintentos largos y provoque 504 en Vercel (~25s). */
const MIDDLEWARE_FETCH_TIMEOUT_MS = 8_000;

function createMiddlewareFetch(): typeof fetch {
  return (input, init) => {
    const timeout = AbortSignal.timeout(MIDDLEWARE_FETCH_TIMEOUT_MS);
    const signal =
      init?.signal != null ? AbortSignal.any([init.signal, timeout]) : timeout;
    return fetch(input, { ...init, signal });
  };
}

function parseSupabaseUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') return null;
    if (!url.hostname || url.hostname.includes(' ')) return null;
    return trimmed.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = parseSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: createMiddlewareFetch() },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options ?? {});
        });
      },
    },
  });

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  } catch {
    // DNS (ENOTFOUND), red, timeout: no bloquear la request 25s ni tumbar el sitio entero
    return supabaseResponse;
  }

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname === '/login';
  const isAuthCallback = pathname.startsWith('/auth/');
  const isDashboard = pathname.startsWith('/dashboard');

  if (!user && !isLoginPage && !isAuthCallback && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

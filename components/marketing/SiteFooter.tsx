import Link from 'next/link';
import styles from './SiteFooter.module.css';

const SITEMAP = [
  { name: 'Soluciones', url: '/cursos' },
  { name: 'Inspiración', url: '/inspiracion' },
  { name: 'Recursos', url: '/blog' },
  { name: 'Recursalia AI', url: '/recursalia-ai' },
  { name: 'Nuestros Clientes', url: '/clientes' },
];

const COMPANY = [
  { name: 'Nosotros', url: '/nosotros' },
  { name: 'Referidos', url: '/referidos' },
  { name: 'Agenda un demo', url: '/cursos' },
  { name: 'Iniciar sesión', url: '/login' },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoMark} aria-hidden>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 10L12 12.5L17 10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>Recursalia</span>
            </Link>
            <p className={styles.tagline}>
              Convertimos la formación interna en una experiencia moderna para equipos, managers y
              operaciones.
            </p>
            <div className={styles.socials}>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.339 18.338V10.67H5.804v7.668zM7.071 9.632a1.469 1.469 0 1 0 0-2.938 1.469 1.469 0 0 0 0 2.938m11.268 8.706v-4.202c0-2.17-.467-3.837-3.003-3.837-1.218 0-2.037.668-2.37 1.302h-.034V10.67H10.53v7.668h2.535v-3.804c0-1.001.19-1.967 1.427-1.967 1.217 0 1.234 1.14 1.234 2.033v3.738z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.16c3.2 0 3.584.012 4.849.07 1.172.053 1.81.248 2.232.415.562.22.96.479 1.381.9.42.42.679.819.9 1.381.166.422.361 1.06.414 2.232.058 1.265.07 1.645.07 4.849s-.012 3.584-.07 4.849c-.053 1.172-.248 1.81-.415 2.232a3.725 3.725 0 0 1-.9 1.381 3.725 3.725 0 0 1-1.381.9c-.422.167-1.06.362-2.232.415-1.265.058-1.645.07-4.849.07s-3.584-.012-4.849-.07c-1.172-.053-1.81-.248-2.232-.415a3.725 3.725 0 0 1-1.381-.9 3.725 3.725 0 0 1-.9-1.381c-.166-.422-.361-1.06-.414-2.232C2.172 15.584 2.16 15.2 2.16 12s.012-3.584.07-4.849c.053-1.172.248-1.81.415-2.232a3.725 3.725 0 0 1 .9-1.381 3.725 3.725 0 0 1 1.381-.9c.422-.166 1.06-.361 2.232-.414C8.416 2.172 8.8 2.16 12 2.16M12 0C8.741 0 8.332.014 7.052.072 5.775.13 4.903.333 4.14.63a5.883 5.883 0 0 0-2.126 1.384A5.883 5.883 0 0 0 .63 4.14C.333 4.903.131 5.775.072 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.058 1.277.261 2.149.558 2.912a5.883 5.883 0 0 0 1.384 2.126 5.883 5.883 0 0 0 2.126 1.384c.763.297 1.635.5 2.912.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.058 2.149-.261 2.912-.558a5.883 5.883 0 0 0 2.126-1.384 5.883 5.883 0 0 0 1.384-2.126c.297-.763.5-1.635.558-2.912.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.058-1.277-.261-2.149-.558-2.912A5.883 5.883 0 0 0 21.986 2.014 5.883 5.883 0 0 0 19.86.63c-.763-.297-1.635-.5-2.912-.558C15.668.014 15.259 0 12 0m0 5.838A6.162 6.162 0 1 0 18.162 12 6.162 6.162 0 0 0 12 5.838M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881" />
                </svg>
              </a>
            </div>
          </div>

          <div className={styles.cols}>
            <div className={styles.col}>
              <p className={styles.colTitle}>Plataforma</p>
              <ul>
                {SITEMAP.map((item) => (
                  <li key={item.name}>
                    <Link href={item.url}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.col}>
              <p className={styles.colTitle}>Compañía</p>
              <ul>
                {COMPANY.map((item) => (
                  <li key={item.name}>
                    <Link href={item.url}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.col}>
              <p className={styles.colTitle}>Contacto</p>
              <p className={styles.muted}>Madrid, España</p>
              <p>
                <a href="mailto:hola@recursalia.com" className={styles.mutedLink}>
                  hola@recursalia.com
                </a>
              </p>
              <p>
                <a href="tel:+34900000000" className={styles.mutedLink}>
                  +34 900 000 000
                </a>
              </p>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>© {year} Recursalia. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

import styles from '../marketing.module.css';

export const metadata = {
  title: 'Criterios editoriales | Recursalia',
  description:
    'Cómo preparamos cursos y contenidos: claridad práctica, transparencia y actualización.',
};

export default function EditorialPage() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h1>Criterios editoriales</h1>
        <p className={styles.empty} style={{ maxWidth: '42rem', lineHeight: 1.65 }}>
          Diseñamos formación práctica pensada para equipos reales: objetivos claros, estructuras
          accionables y lenguaje accesible. Los materiales pasan revisión antes de salir públicos:
          consistencia entre módulos, tono adaptado al perfil del curso y comprobaciones técnicas
          en la plataforma. Cuando algo cambia (herramientas, legislación aplicable al tema o prácticas
          del sector), actualizamos o retiramos contenido obsoleto.
        </p>
      </div>
    </section>
  );
}

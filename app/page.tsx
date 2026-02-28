export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Course SaaS Generator</h1>
      <p>API disponible en:</p>
      <ul>
        <li>POST /api/generate-course</li>
        <li>POST /api/publish-course</li>
        <li>GET /api/courses</li>
        <li>GET /api/courses/:id</li>
      </ul>
    </main>
  );
}

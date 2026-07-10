const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

function App() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">AI Clinic Management System</p>
        <h1>Project foundation is ready.</h1>
        <p>
          The patient, doctor, and administrator experiences will be built here and connected to the clinic API.
        </p>
        <span>API target: {API_URL}</span>
      </section>
    </main>
  );
}

export default App;


export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8 px-4">
      <h1 className="text-2xl font-semibold text-primary">Privacy Policy</h1>
      <div className="space-y-4 text-sm leading-relaxed text-secondary">
        <p>
          HealthID Foundation Ltd ("HealthID", "we") is committed to protecting the privacy of individuals
          whose health data is processed through the platform.
        </p>
        <h2 className="text-base font-semibold text-primary pt-4">Data Boundary</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>On-device:</strong> Raw biometric signals (heart rate, VO2 max, sleep stages) remain on the member's personal device.</li>
          <li><strong>HealthID sees:</strong> Aggregated, pseudonymised verification outcomes (pass/fail against a configured rule). No raw metric history is transmitted.</li>
          <li><strong>The insurer sees:</strong> A yes/no verification receipt per campaign rule, plus cohort-level aggregate statistics. No individual-level health data.</li>
          <li><strong>In this demo:</strong> All member data is synthetic. No real personal health information is processed.</li>
        </ul>
        <h2 className="text-base font-semibold text-primary pt-4">Pilot vs Production</h2>
        <p>
          The architecture described above reflects the intended production design. During pilot engagements,
          data processing agreements are configured per-partner before any real member data is connected.
        </p>
        <h2 className="text-base font-semibold text-primary pt-4">Contact</h2>
        <p>For privacy inquiries: <span className="text-accent">privacy@healthid.life</span></p>
      </div>
    </div>
  );
}

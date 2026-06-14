export default function Security() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8 px-4">
      <h1 className="text-2xl font-semibold text-primary">Security</h1>
      <div className="space-y-4 text-sm leading-relaxed text-secondary">
        <p>
          HealthID's architecture is designed around a zero-custody model: we verify behaviour without
          holding or transmitting raw health data.
        </p>
        <h2 className="text-base font-semibold text-primary pt-4">Architecture Principles</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>On-device processing:</strong> Raw biometric signals are processed locally. Only verification outcomes leave the device.</li>
          <li><strong>Pseudonymisation:</strong> Member identities are separated from verification data at the protocol layer.</li>
          <li><strong>Tenant isolation:</strong> Each partner organisation operates in an isolated data environment with role-based access.</li>
          <li><strong>Encryption:</strong> All data in transit uses TLS 1.3. Data at rest is encrypted with AES-256.</li>
        </ul>
        <h2 className="text-base font-semibold text-primary pt-4">Demo Environment Notice</h2>
        <p>
          This demo instance uses simplified authentication for demonstration purposes.
          Production deployments implement enterprise SSO, hardware-backed key management,
          and audit logging with tamper-evident storage.
        </p>
        <h2 className="text-base font-semibold text-primary pt-4">AI Model Governance</h2>
        <p>
          AI-generated recommendations (campaign suggestions, risk assessments) are clearly labelled
          as model outputs. All AI recommendations require human review before action. Model inputs
          and assumptions are versioned and auditable.
        </p>
        <h2 className="text-base font-semibold text-primary pt-4">Responsible Disclosure</h2>
        <p>For security inquiries: <span className="text-accent">security@healthid.life</span></p>
      </div>
    </div>
  );
}

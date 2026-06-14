export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8 px-4">
      <h1 className="text-2xl font-semibold text-primary">Terms of Use</h1>
      <div className="space-y-4 text-sm leading-relaxed text-secondary">
        <p>
          This platform is operated by HealthID Foundation Ltd, registered in Hong Kong.
          Access is provided under the following terms.
        </p>
        <h2 className="text-base font-semibold text-primary pt-4">Demo Environment</h2>
        <p>
          This instance is a synthetic demonstration environment. All member data, campaign activity,
          proof receipts, and financial projections are modelled examples.
          No real personal health information is processed. No real financial transactions are executed.
        </p>
        <h2 className="text-base font-semibold text-primary pt-4">Not Financial or Actuarial Advice</h2>
        <p>
          The platform provides decision-support tools, including modelled scenarios and AI-generated
          recommendations. These are planning estimates and do not constitute actuarial certification,
          financial advice, or guaranteed outcomes.
        </p>
        <h2 className="text-base font-semibold text-primary pt-4">Intellectual Property</h2>
        <p>
          The HealthID platform, including its signal registry, simulation engine, and verification
          architecture, is proprietary to HealthID Foundation Ltd. Access for evaluation purposes does
          not grant any licence to the underlying technology.
        </p>
        <h2 className="text-base font-semibold text-primary pt-4">Contact</h2>
        <p>For inquiries: <span className="text-accent">legal@healthid.life</span></p>
      </div>
    </div>
  );
}

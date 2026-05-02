# HealthID Campaign Engine: Independent Review

## Bottom line

The business is plausible, but the main risk is not whether the idea is interesting. The main risk is whether you can narrow it into something an insurer will actually buy before the ambition outruns the proof.

Right now the strongest truth is:

- life insurers need better engagement and more relevant data
- underwriting and onboarding friction are still painful
- insurers are under pressure to improve customer experience and profitability at the same time
- AI and workflow orchestration are becoming normal priorities

Right now the weakest truth is:

- the product still implies a broader and more mature system than exists
- claims reduction is strategically attractive but commercially the hardest outcome to prove first
- the zero-knowledge / proof moat is still mostly narrative
- there is not yet a sharp first buyer and first paid workflow

## Does the business make sense?

Yes, with caveats.

The market logic is coherent:

- McKinsey argued in November 2024 that life insurers are searching for new growth and relevance, and specifically called out integrated wealth-and-health solutions, more personalization, and new digital distribution paths as growth axes.
- Swiss Re wrote in October 2023 that APAC life and health insurers are pushing digitalization and automation in underwriting, and that second-level evidence collection remains tedious and slow.
- S&P Global reported on January 26, 2026 that APAC life insurers are prioritizing quality growth, product profitability, and underwriting discipline.
- Capgemini said in October 2024 that best-in-class life insurers materially outperform on NPS, expense ratio, and growth, while onboarding friction and servicing quality remain weak for much of the market.

That supports the broad thesis that a better insurer operating layer around verified health signals could matter.

## What I think is strong

- `Campaign` is the right core object. It gives you a business-facing unit that can support acquisition, underwriting, renewal, and claims-oriented interventions.
- `Binary verified outcomes` are commercially easier to explain than raw data exchange.
- `Insurer brings the users` is the right near-term posture for a B2B sale.
- `Hong Kong + Japan` is a cleaner commercial lens than “all of APAC.”
- The new campaign-engine demo now points at a real insurer workflow rather than a generic enterprise console.

## What I think is weak

- `Replace Vitality` is an ambition, not a near-term strategy.
- `Claims reduction` is now the right lead story, but it is still the easiest place to overclaim.
- The company still does not have a clean first wedge between:
  - acquisition / pre-qualification
  - underwriting acceleration
  - renewal / engagement
  - claims reduction
- The proof architecture is not yet real, so trust must come from honest product framing and believable workflow depth.
- There is no market-specific regulatory and integration packaging yet for Hong Kong or Japan.

## What insurers are likely to like

- lower raw-data custody burden
- a clearer consent and verification story
- faster or lower-friction campaigns and underwriting moments
- better customer-facing engagement surfaces
- a more modern operating layer around outreach, targeting, and verification

## What will make insurers nervous

- claims reduction numbers presented as if already validated
- any implication that “privacy by design” is already proven without a real architecture and control model
- weak explanation of where human review remains required
- too much product breadth without one clearly pilotable workflow
- wellness language that sounds like loyalty marketing rather than risk, underwriting, retention, or operating efficiency

## What you are still missing

- a crisp first buyer map by account type
- a defined first paid pilot scope
- a real system-boundary explanation
- a market-by-market deployment view
- explicit guardrails on what is simulated today versus what becomes real in pilot
- a proof of why members will keep participating beyond incentives

## Recommended commercial stance

The updated stance should be:

- `Top-of-funnel story`: verified health campaign infrastructure for life insurers
- `Primary story`: claims reduction
- `Secondary motion`: underwriting / pre-policy verification
- `Also included`: engagement and lead generation
- `Long-term ambition`: insurer wellness operating system

This is directionally stronger than a generic platform story, but it creates a sharper burden:

- claims reduction must be presented as modeled and directional
- underwriting support must remain visible as the more immediately legible adjacent use case
- the trust story must be tighter because buyers will test the gap between modeled impact and operational reality

## What to say more carefully

- Say `modeled business outcome`, not `actuarially proven savings`.
- Say `binary verified outcome receipt`, not `production-grade zero-knowledge infrastructure`, unless that exists.
- Say `campaign engine for insurer outcomes`, not `full replacement platform`, unless the buyer conversation explicitly wants the larger roadmap.

## Agentic AI recommendation

An agent is a good fit here, but only if it owns a real insurer workflow.

The right first agent is still:

- `Campaign Strategy Agent`

Its jobs:

- recommend claims-reduction campaign configurations for a stated insurer objective
- identify the best reachable cohort and explain the tradeoffs
- compare claims-reduction and underwriting-adjacent variants of the same campaign logic
- explain the modeled business case and weak assumptions
- flag launch risks, trust gaps, and missing evidence
- draft executive, actuarial, and operations summaries

Do not start with:

- autonomous underwriting
- claims adjudication
- free-form chatbot theater

OpenAI’s current guide is a good fit for this decision boundary: agents make sense where workflows are multi-step, tool-using, and hard to capture in deterministic rules. Microsoft’s February 18, 2026 insurance post also aligns with this by emphasizing underwriting, distribution, service, and compliance workflow orchestration rather than generic chat.

## What I would do next

1. Keep the product broad at the narrative layer, but make claims reduction the center of gravity.
2. Keep underwriting / pre-policy verification visible as the secondary commercial path.
3. Build the proof and verification boundary honestly.
4. Package Hong Kong and Japan as named launch markets with concrete assumptions.
5. Make the agent advisory and auditable before it becomes action-taking.

## Sources

- McKinsey, *Global Insurance Report 2025: Growth and relevance in life and beyond*  
  https://www.mckinsey.com/industries/financial-services/our-insights/global-insurance-report-2025-growth-and-relevance-in-life-and-beyond
- Swiss Re, *What will drive APAC's next breakthrough in data-driven underwriting?*  
  https://www.swissre.com/reinsurance/life-and-health/reinsurance/insights-life-apac/what-will-drive-apacs-next-breakthrough-in-data-driven-underwriting.html
- S&P Global, *APAC 2026 insurance outlook: Insurers face geopolitical, catastrophe, AI risks*  
  https://www.spglobal.com/market-intelligence/en/news-insights/articles/2026/1/apac-2026-insurance-outlook-insurers-face-geopolitical-catastrophe-ai-risks-96218077
- Capgemini / Business Wire, *Policyholder Expectations Pose Challenges for Life Insurers at Every Stage of the Customer Journey*  
  https://www.businesswire.com/news/home/20241015467428/en/Policyholder-Expectations-Pose-Challenges-for-Life-Insurers-at-Every-Stage-of-the-Customer-Journey
- OpenAI, *A practical guide to building agents*  
  https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/
- Microsoft, *From bottlenecks to breakthroughs: How agentic AI is reshaping insurance*  
  https://www.microsoft.com/en-us/microsoft-cloud/blog/financial-services/2026/02/18/from-bottlenecks-to-breakthroughs-how-agentic-ai-is-reshaping-insurance/
- RGA, *U.S. Wellness Survey Results*  
  https://www.rgare.com/docs/default-source/knowledge-center-articles/u-s-wellness-survey---report---final.pdf?sfvrsn=996e790d_1

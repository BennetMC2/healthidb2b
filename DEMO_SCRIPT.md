# HealthID — Insurer Cockpit Demo Script (Loom, ~6 min)

## The one-line story to prove
> *An insurer can decide where to spend incentive budget to drive **verified** behaviour change — with an engine whose every number they can open up, switch between a conservative and an upside case, and trust enough to sign off on.*

Two things must land: **(1) it's an actuarial decision tool, not a marketing tool**, and **(2) the numbers are honest and inspectable** (the model switch + Model Studio). The ZK/verification layer is the moat underneath.

## Setup before you record
- Hard-refresh `app.healthid.life` (or `?v=N`) so you're on the latest build.
- Persona: **Meridian Health Insurance** (insurer).
- Model switch (top-right): start on **Forward / Upside** (the default).
- **Golden thread:** follow **one play — VO₂ / Cardio Fitness Activation** — all the way through. It's the strongest, cleanest number. Don't tour every page.

---

## Scene-by-scene

**0:00 — Framing (~30s)** · *Screen: AI Actuary landing*
> "This is the insurer cockpit for HealthID. The pitch in one line: instead of guessing where to spend wellness incentives, an actuary opens this and sees — ranked by verified value — which plays move their book, what each is worth, and what to do. Everything here is computed by a real actuarial engine, and I'll show you that you can open up every number."

**0:30 — The recommended plays (~45s)** · *Hover the VO₂ card*
> "Each card is a model-ranked play. Cardio Fitness Activation — 3,847 members with declining VO₂. The engine says: book-value opportunity ~$34K, ROI ~4.3×, payback 3 months, with a confidence band. Notice it doesn't pretend every play is a winner — some down here are modest. That honesty matters, and I'll come back to it."

**1:15 — The model switch: the trust move (~60s)** ⭐ *the wow moment — do it slowly*
> *Header dropdown: Forward → Evidence Floor. Point at one number changing.*
> "Top-right is the model switch. We're on the **Forward** case. Watch when I flip to the **Evidence Floor** — the conservative, published-evidence-only case... every number in the app re-prices live. VO₂ drops from ~4.3× to ~2.7×, and the badge follows the numbers everywhere, so you can never mistake the upside case for the base case. That's what makes this defensible in front of a risk committee."

**2:15 — Model Studio: open the engine up (~75s)** · *Sidebar → Model Studio*
> *Open 'How this works', then a Clinical/Actuarial assumption row, then the 'Diff vs. floor' panel.*
> "If they don't believe a number, they open it. Every assumption — claims attribution, dose-response, mortality, reward economics — is here, with its source and a confidence flag: green is published literature, amber is an assertion we still need to source. The Forward model is just a labelled fork of the floor — here's exactly what differs and why. An actuary can edit a value, give a reason, the whole book re-prices, and they can sign it off into a governed floor. Nothing's a black box."

**3:30 — The Simulator: the engine behind the number (~75s)** · *Back to VO₂ card → Re-simulate → Run simulation*
> "Behind each headline is a live simulation. These are AI member-agents deciding whether to engage at the reward — actual heterogeneous decisions, not a formula — then a Monte Carlo turns behaviour into value. And the Decision readout lands on the **same** numbers as the card. One source of truth — the card, the gallery, the create flow, and the simulator all agree."
> *(Leave the reward lever where it loads — don't drag it to the extremes.)*

**4:45 — Verification Trail: the moat (~45s)** · *Sidebar → Verification Trail*
> "And the reason an insurer can pay for *verified* outcomes at all: this. Every outcome is a zero-knowledge proof — we confirm the member hit the goal without ever touching their raw health data. Zero PII access, all auditable. That verification grade is literally a value multiplier in the engine — a verified outcome is worth ~4× a self-reported one, because the insurer can actually book it."

**5:30 — Close (~30s)**
> "So the loop is: see the ranked plays, interrogate the assumptions, stress-test in the simulator, commit the campaign — and the verified proofs that come back re-price the next allocation. Conservative floor, defensible upside, one trustworthy engine underneath."

---

## Nail these
- **Do the model switch slowly** and call out one specific number changing (~4.3× → ~2.7×). That single interaction sells the whole "trustworthy" thesis.
- **Lead and linger on VO₂** — strongest, cleanest story.

## Avoid these
- **Don't dwell on HRV / Sleep** (~1.6–1.7×). If asked, use it: "the engine won't rubber-stamp a weak play — that's a feature."
- **Don't drag the reward lever to the extremes** in the sim on camera (the low end shows a +900% artifact). Leave it where it loads.

## Current play numbers (Forward model, for reference)
| Play | Book-value opportunity | ROI | Payback |
|---|---|---|---|
| VO₂ / Cardio | ~$34K | ~4.3× | 3 mo |
| Resting HR | ~$8K | ~2.6× | 4 mo |
| Sleep | ~$28K | ~1.7× | 7 mo |
| HRV | ~$27K | ~1.6× | — |

*(These are real deterministic engine runs at $2 PMPM under the Evidence-Floor model, scaled to Forward. Switch to Evidence Floor and they drop — HRV goes to ~break-even, which is the floor being honest.)*

import type { BehaviouralEconModifier } from '../types';

export const BEHAVIOURAL_ECON_MODIFIERS: BehaviouralEconModifier[] = [
  {
    id: 'loss_aversion',
    name: 'Loss Aversion',
    description: 'Frame rewards as something to lose rather than gain. Members start with points that decay if targets are not met. ~50% participation lift observed in clinical trials (Patel 2019 STEP UP).',
    liftFactor: 0.50,
    category: 'loss_aversion',
    enabled: true,
  },
  {
    id: 'anchoring',
    name: 'Anchoring Effect',
    description: 'Set ambitious but achievable default targets. Members anchor to the suggested goal and self-adjust downward less than they would from zero. ~15% improvement in target adherence.',
    liftFactor: 0.15,
    category: 'anchoring',
    enabled: true,
  },
  {
    id: 'streak_multiplier',
    name: 'Streak Multiplier',
    description: 'Multiply rewards for consecutive days/weeks of target achievement. Streaks create endowment effect — members are reluctant to break a chain. ~25% persistence improvement.',
    liftFactor: 0.25,
    category: 'streaks',
    enabled: true,
  },
  {
    id: 'positive_framing',
    name: 'Positive Framing',
    description: 'Frame health improvements in terms of gains ("You added 2 years of healthy life") rather than risk reduction ("You reduced mortality by 15%"). ~10% engagement lift.',
    liftFactor: 0.10,
    category: 'framing',
    enabled: false,
  },
];

export function getActiveModifiers() {
  return BEHAVIOURAL_ECON_MODIFIERS.filter((m) => m.enabled);
}

export function computeBehaviouralLift(enabledModifierIds: string[]): number {
  const activeModifiers = BEHAVIOURAL_ECON_MODIFIERS.filter((m) =>
    enabledModifierIds.includes(m.id),
  );
  if (activeModifiers.length === 0) return 1.0;

  // Diminishing returns: each additional modifier contributes 70% of its raw lift
  const sorted = [...activeModifiers].sort((a, b) => b.liftFactor - a.liftFactor);
  let totalLift = 1.0;
  sorted.forEach((mod, i) => {
    const diminished = mod.liftFactor * Math.pow(0.70, i);
    totalLift += diminished;
  });
  return Math.min(totalLift, 2.0);
}

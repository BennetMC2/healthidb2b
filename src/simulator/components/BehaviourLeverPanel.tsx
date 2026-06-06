import type { BehaviourLeverId } from '../types';
import RiskLeverSlider from './RiskLeverSlider';
import { BEHAVIOUR_LEVERS } from '../data/behaviourLevers';

interface BehaviourLeverPanelProps {
  baselines: Record<BehaviourLeverId, number>;
  targets: Record<BehaviourLeverId, number>;
  onChange: (lever: BehaviourLeverId, value: number) => void;
  readOnly?: boolean;
  leversToShow?: BehaviourLeverId[];
}

export default function BehaviourLeverPanel({ baselines, targets, onChange, readOnly, leversToShow }: BehaviourLeverPanelProps) {
  const levers = leversToShow
    ? BEHAVIOUR_LEVERS.filter((l) => leversToShow.includes(l.id))
    : BEHAVIOUR_LEVERS;

  return (
    <div className="space-y-4">
      {levers.map((lever) => (
        <div key={lever.id}>
          <RiskLeverSlider
            lever={lever.id}
            baseline={baselines[lever.id] ?? 0}
            target={targets[lever.id] ?? baselines[lever.id] ?? 0}
            onChange={(val) => onChange(lever.id, val)}
            readOnly={readOnly}
          />
          <p className="mt-0.5 text-2xs text-tertiary">{lever.description}</p>
        </div>
      ))}
    </div>
  );
}

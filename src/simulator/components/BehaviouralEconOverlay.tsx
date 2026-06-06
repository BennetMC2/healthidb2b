import { Brain, Flame, Link, MessageSquare } from 'lucide-react';
import { BEHAVIOURAL_ECON_MODIFIERS } from '../data/behaviouralEconomics';

interface BehaviouralEconOverlayProps {
  enabledIds: string[];
  onToggle: (id: string) => void;
}

const categoryIcons: Record<string, typeof Brain> = {
  loss_aversion: Brain,
  anchoring: Flame,
  streaks: Link,
  framing: MessageSquare,
};

export default function BehaviouralEconOverlay({ enabledIds, onToggle }: BehaviouralEconOverlayProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-primary font-display">Behavioural Economics Modifiers</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {BEHAVIOURAL_ECON_MODIFIERS.map((mod) => {
          const isEnabled = enabledIds.includes(mod.id);
          const Icon = categoryIcons[mod.category] ?? Brain;

          return (
            <div
              key={mod.id}
              className={`card cursor-pointer transition-all duration-150 ${
                isEnabled ? 'ring-1 ring-accent/40 bg-accent/5' : ''
              }`}
              onClick={() => onToggle(mod.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isEnabled ? 'bg-accent text-white' : 'bg-accent/10 text-accent'
                }`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-primary">{mod.name}</h4>
                    <span className={`text-2xs font-mono ${isEnabled ? 'text-green-500' : 'text-tertiary'}`}>
                      +{Math.round(mod.liftFactor * 100)}% lift
                    </span>
                  </div>
                  <p className="mt-1 text-2xs text-tertiary leading-relaxed">{mod.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

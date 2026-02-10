export type ActionType = 'auto' | 'click-target' | 'click-any-in' | 'interact';

export interface WalkthroughStep {
  id: string;
  route: string | null;
  title: string;
  narration: string;
  targetSelector: string | null;
  actionType: ActionType;
  actionHint?: string;
  autoScrollTo?: string;
  delayMs?: number;
}

export const BREACH_COST_PER_RECORD_USD = 9770;

export function liabilityAvoidedFromReceipts(receipts: number): number {
  return receipts * BREACH_COST_PER_RECORD_USD;
}

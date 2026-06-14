export const DISCOUNTING_MODULE = {
  moduleName: "default-discounting",
  moduleVersion: "0.1.0",
};

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function annuityPresentValueFactor(years: number, annualDiscountRate: number): number {
  const y = clamp(years, 0, 100);
  const r = Math.max(0, annualDiscountRate);
  if (y <= 0) return 0;
  if (r === 0) return y;
  return (1 - Math.pow(1 + r, -y)) / r;
}

export function presentValueRecurringAnnual(amountPerYear: number, years: number, annualDiscountRate: number): number {
  return amountPerYear * annuityPresentValueFactor(years, annualDiscountRate);
}

export function presentValueFactor(years: number, annualDiscountRate: number): number {
  return annuityPresentValueFactor(years, annualDiscountRate);
}

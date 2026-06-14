// ---------------------------------------------------------------------------
// Signal registry — re-exports from the shared module so all existing server
// imports continue to work unchanged.
// ---------------------------------------------------------------------------
export {
  SIGNALS,
  FUSIONS,
  EMERGING_HAIRCUT,
  TRUST_VALUE_MODIFIER,
  allSignals,
  getSignal,
  maybeSignal,
  getFusion,
  signalsForCategory,
  primarySignalFor,
  evidenceGateMultiplier,
} from "@shared/signals";

export const SIGNAL_REGISTRY_MODULE = {
  moduleName: "signal-registry",
  moduleVersion: "0.1.0",
};

export const FUSION_MODULE = {
  moduleName: "signal-fusion",
  moduleVersion: "0.1.0",
};

export const EVIDENCE_GATE_MODULE = {
  moduleName: "evidence-tier-gate",
  moduleVersion: "0.1.0",
};

export const TRUST_MODIFIER_MODULE = {
  moduleName: "trust-tier-modifier",
  moduleVersion: "0.1.0",
};

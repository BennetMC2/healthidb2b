export type ClaimsBridgeKey = "steps" | "vo2max" | "sleep" | "bp_screening" | "hba1c_screening";

export function signalToClaimsBridgeKey(signalId: string): ClaimsBridgeKey {
  if (signalId === "hba1c") return "hba1c_screening";
  if (signalId === "bp") return "bp_screening";
  if (signalId === "sleep_regularity") return "sleep";
  if (signalId === "glucose_tir") return "hba1c_screening";
  if (signalId === "resting_hr" || signalId === "hrv" || signalId === "respiratory_rate") return "vo2max";
  if (signalId === "gait_speed") return "steps";
  if (signalId === "sleep" || signalId === "bp_screening" || signalId === "hba1c_screening") return signalId;
  if (signalId === "steps" || signalId === "vo2max") return signalId;
  return "vo2max";
}


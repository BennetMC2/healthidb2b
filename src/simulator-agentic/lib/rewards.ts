import type { RewardOptimization, RewardRoiPoint } from "@shared/schema";

export function emptyRewardPoint(reward: number): RewardRoiPoint {
  return {
    reward,
    rewardHp: reward * 100,
    engagement: 0,
    behaviorChange: 0,
    members: 0,
    claimsSaved: 0,
    productivityValue: 0,
    retentionValue: 0,
    mortalityValue: 0,
    valueCreated: 0,
    rewardToSustain: 0,
    adminCost: 0,
    platformCost: 0,
    totalCost: 0,
    netValue: 0,
    roi: 0,
    roiP50: 0,
    roiP5: 0,
    roiP95: 0,
    netValueP5: 0,
    netValueP95: 0,
  };
}

export function interpolateRewardPoint(curve: RewardRoiPoint[], reward: number): RewardRoiPoint {
  if (curve.length === 0) return emptyRewardPoint(reward);
  if (reward <= curve[0].reward) return curve[0];
  if (reward >= curve[curve.length - 1].reward) return curve[curve.length - 1];
  let i = 0;
  while (i < curve.length - 1 && curve[i + 1].reward < reward) i++;
  const a = curve[i];
  const b = curve[i + 1];
  const span = b.reward - a.reward;
  const t = span > 0 ? (reward - a.reward) / span : 0;
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    reward,
    rewardHp: lerp(a.rewardHp, b.rewardHp),
    engagement: lerp(a.engagement, b.engagement),
    behaviorChange: lerp(a.behaviorChange, b.behaviorChange),
    members: Math.round(lerp(a.members, b.members)),
    claimsSaved: lerp(a.claimsSaved, b.claimsSaved),
    productivityValue: lerp(a.productivityValue, b.productivityValue),
    retentionValue: lerp(a.retentionValue, b.retentionValue),
    mortalityValue: lerp(a.mortalityValue ?? 0, b.mortalityValue ?? 0),
    valueCreated: lerp(a.valueCreated, b.valueCreated),
    rewardToSustain: lerp(a.rewardToSustain, b.rewardToSustain),
    adminCost: lerp(a.adminCost, b.adminCost),
    platformCost: lerp(a.platformCost, b.platformCost),
    totalCost: lerp(a.totalCost, b.totalCost),
    netValue: lerp(a.netValue, b.netValue),
    roi: lerp(a.roi, b.roi),
    roiP50: lerp(a.roiP50, b.roiP50),
    roiP5: lerp(a.roiP5, b.roiP5),
    roiP95: lerp(a.roiP95, b.roiP95),
    netValueP5: lerp(a.netValueP5, b.netValueP5),
    netValueP95: lerp(a.netValueP95, b.netValueP95),
  };
}

export function suggestedReward(opt: RewardOptimization): number {
  if (typeof opt.recommendedRewardIndex === "number" && opt.roiCurve[opt.recommendedRewardIndex]) {
    return opt.roiCurve[opt.recommendedRewardIndex].reward;
  }
  return opt.optimalReward;
}


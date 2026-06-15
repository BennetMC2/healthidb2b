// ===========================================================================
// Request-scoped active Model (Assumptions Studio brief §1, §3, §4).
//
// The engine reads assumptions from module-level constants in many places. To
// let a request run against a *selected* Model without threading a parameter
// through dozens of call sites — and without races between concurrent requests
// on different models — we hold the active Model in an AsyncLocalStorage and
// expose the assumption constants as Proxies that read the current request's
// Model (falling back to the Model 1 floor outside any request).
//
// NOTE: this module must NOT be imported by assumptionSets.ts — that would
// create a cycle (assumptionSets → modelContext → models → assumptionSets) and
// leave the Model payloads undefined at load time. Keep it downstream-only.
// ===========================================================================

import { AsyncLocalStorage } from "node:async_hooks";
import type { Model } from "./models";
import { resolveActiveModel } from "./models";

const store = new AsyncLocalStorage<Model>();

// Run fn (and everything it awaits) with the given Model as the active model.
export function runWithModel<T>(
  modelId: string | undefined,
  fn: () => T,
  opts?: { allowInternal?: boolean },
): T {
  return store.run(resolveActiveModel(modelId, opts), fn);
}

// Set the active Model for the remainder of the current request's async
// context. Ergonomic fit for Express handlers (one line at the top of a
// handler) vs. wrapping the whole body in runWithModel.
export function enterModel(modelId: string | undefined, opts?: { allowInternal?: boolean }): Model {
  const model = resolveActiveModel(modelId, opts);
  store.enterWith(model);
  return model;
}

export function currentModel(): Model {
  return store.getStore() ?? resolveActiveModel(undefined);
}

export function currentSet() {
  return currentModel().set;
}

// Build a Proxy that always reflects a slice of the current request's Model set.
// Keeps existing `CONST.foo` / spread / Object.keys call-sites working unchanged.
function liveProxy<T extends object>(pick: () => T): T {
  return new Proxy({} as T, {
    get: (_t, prop) => (pick() as Record<string | symbol, unknown>)[prop],
    has: (_t, prop) => prop in (pick() as object),
    ownKeys: () => Reflect.ownKeys(pick() as object),
    getOwnPropertyDescriptor: (_t, prop) => {
      const desc = Object.getOwnPropertyDescriptor(pick() as object, prop);
      if (desc) desc.configurable = true; // required for ownKeys/spread to enumerate a Proxy
      return desc;
    },
  });
}

export const liveEconomic = () => currentSet().economic;
export const liveLife = () => currentSet().lifeInsurance;
export const liveMarketWearablePrior = () => currentSet().marketWearablePrior;
export const liveRewardAllocation = () => currentSet().rewardAllocation;

export { liveProxy };

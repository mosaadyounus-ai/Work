import {
  ArbiterProfile,
  AssignmentRequest,
  AssignmentResult,
  ChorusMode,
} from "./shared-types";

function seededSortValue(seed: number, label: string) {
  let hash = seed;
  for (let index = 0; index < label.length; index += 1) {
    hash = (hash * 31 + label.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function rankedScore(arbiter: ArbiterProfile) {
  return arbiter.qualityScore * 0.6 + arbiter.serviceScore * 0.25 - arbiter.concentrationRisk * 0.15;
}

function strategyForMode(mode: ChorusMode) {
  switch (mode) {
    case "NORMAL":
      return "weighted";
    case "THROTTLED":
      return "capped-weighted";
    case "STRESS":
      return "safe-band-random";
    case "INVERTED":
      return "frozen-band-random";
    case "RECOVERY":
      return "probationary-weighted";
  }
}

export function planAssignments(request: AssignmentRequest): AssignmentResult {
  const strategy = strategyForMode(request.modeState.mode);
  const seed = request.seed ?? 17;
  const available = request.arbiters.filter((arbiter) => arbiter.available);

  let pool = [...available];

  if (request.modeState.mode === "THROTTLED") {
    pool = pool.filter((arbiter) => arbiter.currentLoad <= 18);
  }

  if (request.modeState.mode === "STRESS") {
    pool = pool.filter((arbiter) => arbiter.band !== "C" && arbiter.currentLoad <= 22);
  }

  if (request.modeState.mode === "INVERTED") {
    pool = pool.filter((arbiter) => arbiter.band === "A" || arbiter.band === "B");
  }

  if (request.modeState.mode === "RECOVERY") {
    pool = pool.filter((arbiter) => arbiter.currentLoad <= 20);
  }

  if (strategy.includes("weighted")) {
    pool.sort((left, right) => rankedScore(right) - rankedScore(left));
  } else {
    pool.sort(
      (left, right) =>
        seededSortValue(seed, left.arbiterId) - seededSortValue(seed, right.arbiterId),
    );
  }

  const assignments = pool.slice(0, request.batchSize).map((arbiter, index) => ({
    slot: index + 1,
    arbiterId: arbiter.arbiterId,
    reason: `${strategy} / band ${arbiter.band} / load ${arbiter.currentLoad}`,
  }));

  return {
    assignments,
    strategy,
    frozen: request.modeState.demotionsFrozen,
  };
}

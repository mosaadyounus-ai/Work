import { SAPClaim, SAPEvent } from "./shared-types";

export function advanceSAPClaim(claim: SAPClaim, event: SAPEvent): SAPClaim {
  switch (event.type) {
    case "OPEN_COUNTER_WINDOW":
      return { ...claim, status: "COUNTER_WINDOW" };
    case "ASSIGN_ARBITER":
      return { ...claim, status: "ARBITER_ASSIGNED" };
    case "SYNTHESIZE":
      return {
        ...claim,
        status: "SYNTHESIZED",
        synthesis: event.synthesis ?? claim.synthesis,
        unresolvedCount: event.unresolvedCount ?? claim.unresolvedCount,
        disputeTypes: event.disputeTypes ?? claim.disputeTypes,
      };
    case "OPEN_ACCEPTANCE":
      return { ...claim, status: "ACCEPTANCE_WINDOW" };
    case "COMMIT":
      return {
        ...claim,
        status: claim.staleReference ? "VOID" : "COMMITTED",
        uncontested: claim.unresolvedCount === 0,
      };
    case "ESCALATE":
      return { ...claim, status: "ESCALATED" };
    case "VOID":
      return { ...claim, status: "VOID", staleReference: true };
  }
}

export function semanticLockSatisfied(claim: SAPClaim) {
  return claim.status === "COMMITTED" && !claim.staleReference;
}

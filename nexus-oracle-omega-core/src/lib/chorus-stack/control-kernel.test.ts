import assert from "node:assert/strict";
import test from "node:test";
import { planAssignments } from "./assignment-engine";
import { hasTerminalClosure, reduceChorusTx } from "./chorus-core";
import { evaluateControlKernel } from "./control-kernel";
import { buildRTTSEvidence, summarizeContamination } from "./rtts-evidence";
import { advanceSAPClaim, semanticLockSatisfied } from "./sap-engine";

test("control kernel enters inverted on contaminated signals", () => {
  const mode = evaluateControlKernel({
    queueDepth: 180,
    queueThreshold: 120,
    reliabilityCorrelation: 0.76,
    fallbackCorrelation: 0.21,
    stressSignal: true,
  });

  assert.equal(mode.mode, "INVERTED");
  assert.equal(mode.demotionsFrozen, true);
  assert.equal(mode.rankingEnabled, false);
});

test("assignment engine respects frozen safe pool in inverted mode", () => {
  const result = planAssignments({
    batchSize: 2,
    modeState: {
      mode: "INVERTED",
      demotionsFrozen: true,
      rankingEnabled: false,
      manualAuditRequired: true,
      rationale: ["test"],
    },
    arbiters: [
      {
        arbiterId: "arb-a",
        qualityScore: 0.92,
        serviceScore: 0.78,
        currentLoad: 9,
        concentrationRisk: 0.1,
        available: true,
        band: "A",
      },
      {
        arbiterId: "arb-b",
        qualityScore: 0.71,
        serviceScore: 0.72,
        currentLoad: 12,
        concentrationRisk: 0.2,
        available: true,
        band: "B",
      },
      {
        arbiterId: "arb-c",
        qualityScore: 0.55,
        serviceScore: 0.49,
        currentLoad: 7,
        concentrationRisk: 0.1,
        available: true,
        band: "C",
      },
    ],
    seed: 9,
  });

  assert.equal(result.frozen, true);
  assert.equal(result.assignments.every((entry) => entry.arbiterId !== "arb-c"), true);
});

test("SAP semantic lock only opens after commit", () => {
  const claim = advanceSAPClaim(
    {
      claimId: "claim-1",
      chorusTxId: "tx-1",
      status: "REGISTERED",
      synthesis: null,
      unresolvedCount: 0,
      uncontested: false,
      staleReference: false,
      disputeTypes: [],
    },
    { type: "COMMIT" },
  );

  assert.equal(semanticLockSatisfied(claim), true);
});

test("Chorus transactions must end in a terminal state", () => {
  const tx = reduceChorusTx(
    {
      txId: "tx-1",
      payloadHash: "abc",
      status: "REGISTERED",
      signatures: 1,
      deadline: Date.now() + 500,
      recordedAt: Date.now(),
    },
    { type: "EXECUTE", now: Date.now() },
  );

  assert.equal(hasTerminalClosure(tx), true);
});

test("RTTS evidence stays evidence-only and exposes contamination summaries", () => {
  const evidence = buildRTTSEvidence(
    {
      arbiterId: "arb-a",
      qualityScore: 0.88,
      serviceScore: 0.74,
      currentLoad: 18,
      concentrationRisk: 0.15,
      available: true,
      band: "A",
    },
    "stress",
  );
  const summary = summarizeContamination(0.48, 0.28);

  assert.ok(evidence.loadNormalizedServiceScore < evidence.serviceScore);
  assert.equal(summary.contaminated, false);
});

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { join } from "node:path";
import { OracleKernel } from "../kernel";

describe("OracleKernel - Two-Peak ConversionFront", () => {
  const kernel = new OracleKernel(join(process.cwd(), "mirror", "two_peak_example.json"));

  test("loads contract correctly", () => {
    assert.ok(kernel);
  });

  test("evaluates envelope at origin", () => {
    const state = { phi: 0, r: 0, s: 0, e: 0, mode: "IDLE" };
    assert.equal(kernel.evaluateEnvelope(state), 0);
  });

  test("classifies below kink (Facet-A wins)", () => {
    const result = kernel.classifyPoint2D(0, 0.2);
    assert.equal(result.facet, "Facet-A");
  });

  test("classifies above kink (Facet-B wins)", () => {
    const result = kernel.classifyPoint2D(0, 0.3);
    assert.equal(result.facet, "Facet-B");
  });

  test("computes M_min at kink boundary", () => {
    const M = kernel.computeMmin2D(0, 0.25);
    const MA = kernel.computeMmin2D(0, 0.249);
    const MB = kernel.computeMmin2D(0, 0.251);

    assert.ok(Math.abs(M - 4.5) < 1e-9);
    assert.ok(Math.abs(MA - 4.498) < 0.01);
    assert.ok(Math.abs(MB - 4.506) < 0.01);
  });

  test("detects support gap", () => {
    const gap = kernel.supportGap2D(0, 0.2);
    assert.ok(gap.current > gap.next);
    assert.ok(gap.gap > 0);
  });

  test("returns the verified kink line", () => {
    const kink = kernel.getKink(0);
    assert.equal(kink.formula, "C_r = (1 + C_phi) / 4");
    assert.ok(Math.abs(kink.value - 0.25) < 1e-9);
  });

  test("full evaluation produces valid output", () => {
    const state = { phi: 4, r: 2, s: 0, e: 4, mode: "FUSION" };
    const result = kernel.evaluate2D(state, 0, 0.2);

    assert.equal(result.envelope.W, 4.4);
    assert.equal(result.facet.facet, "Facet-A");
    assert.equal(result.envelope.inside, true);
    assert.ok(typeof result.timestamp === "string" && result.timestamp.length > 0);
  });

  test("reports phi-A attractor membership when Facet-A is active and admissible", () => {
    const state = { phi: 4, r: 2, s: 0, e: 4, mode: "FUSION" };
    const result = kernel.evaluate2D(state, 0.1, 0.25);

    assert.equal(result.attractor.in_phi_attractor, true);
    assert.equal(result.attractor.attractor_id, "G_phi");
    assert.equal(result.attractor.law_status.phiA.satisfied, true);
  });

  test("keeps phi-A attractor inactive when the non-phi facet wins", () => {
    const state = { phi: 3, r: 6, s: 0, e: 3, mode: "FUSION" };
    const result = kernel.evaluate2D(state, 0, 0.3);

    assert.equal(result.facet.facet, "Facet-B");
    assert.equal(result.attractor.in_phi_attractor, false);
  });
});

describe("OracleKernel - Three-Peak ConversionFront", () => {
  const kernel = new OracleKernel(join(process.cwd(), "mirror", "three_peak_example.json"));

  test("loads the advanced contract", () => {
    assert.ok(kernel);
    assert.equal(kernel.getContract().peaks.length, 3);
  });

  test("evaluates the s-weighted envelope term", () => {
    const state = { phi: 3, r: 6, s: 1, e: 3, mode: "FUSION" };
    assert.equal(kernel.evaluateEnvelope(state, { C_phi: 0, C_r: 0, C_s: 0.4 }), 3.4);
  });

  test("projects a 3D boundary into the C_phi / C_r plane", () => {
    const kink = kernel.getKink(0, 0.2);
    assert.equal(kink.formula, "C_r = (1 + C_phi - C_s) / 4");
    assert.ok(Math.abs(kink.value - 0.2) < 1e-9);
  });

  test("degenerate contract favors Peak-P3 above the shared boundary when C_s = 0", () => {
    const result = kernel.classifyPoint2D(0, 0.3);
    assert.equal(result.facet, "Facet-P3");
  });

  test("evaluate2D remains equivalent to evaluate with C_s = 0 on the same contract", () => {
    const state = { phi: 4, r: 2, s: 0, e: 4, mode: "FUSION" };
    const twoD = kernel.evaluate2D(state, 0.1, 0.2);
    const threeD = kernel.evaluate(state, { C_phi: 0.1, C_r: 0.2, C_s: 0 });

    assert.deepEqual(twoD.weights, threeD.weights);
    assert.equal(twoD.facet.facet, threeD.facet.facet);
    assert.equal(twoD.envelope.M_min, threeD.envelope.M_min);
  });

  test("marks the advanced phi-governed facet as inside G_phi when P1 wins", () => {
    const state = { phi: 4, r: 2, s: 0, e: 4, mode: "FUSION" };
    const result = kernel.evaluate(state, { C_phi: 0.1, C_r: 0.25, C_s: 0 });

    assert.equal(result.facet.facet, "Facet-P1");
    assert.equal(result.attractor.in_phi_attractor, true);
    assert.equal(result.attractor.attractor_id, "G_phi");
  });
});

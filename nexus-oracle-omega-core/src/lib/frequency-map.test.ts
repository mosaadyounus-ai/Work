import assert from "node:assert/strict";
import test from "node:test";
import {
  CORE_FREQUENCY,
  HARMONIC_SHELLS,
  buildLatticeState,
  createDefaultLatticeControls,
  identifyNoteAnchor,
  sampleFieldAtPoint,
} from "./frequency-map";

test("harmonic shells are fixed to the 167.89 ladder", () => {
  assert.equal(CORE_FREQUENCY, 167.89);
  assert.deepEqual(
    HARMONIC_SHELLS.map((shell) => Number(shell.hz.toFixed(2))),
    [167.89, 335.78, 503.67, 671.56, 839.45, 1007.34],
  );
});

test("note anchor identifies 167.89Hz near E3 with positive cents offset", () => {
  const anchor = identifyNoteAnchor(CORE_FREQUENCY);

  assert.equal(anchor.note, "E3");
  assert.equal(anchor.referenceHz, 164.81);
  assert.equal(anchor.centsOffset, 32);
  assert.equal(anchor.periodMs, 5.96);
});

test("lattice generation is deterministic for identical inputs", () => {
  const controls = createDefaultLatticeControls();
  const first = buildLatticeState(controls);
  const second = buildLatticeState(controls);

  assert.equal(first.nodes.length, second.nodes.length);
  assert.deepEqual(first.nodes[0], second.nodes[0]);
  assert.deepEqual(first.nodes[first.nodes.length - 1], second.nodes[second.nodes.length - 1]);
});

test("field sampling is stable for fixed nodes and time", () => {
  const state = buildLatticeState(createDefaultLatticeControls());
  const first = sampleFieldAtPoint([0.8, 0.1, -0.3], 0.25, state.nodes);
  const second = sampleFieldAtPoint([0.8, 0.1, -0.3], 0.25, state.nodes);

  assert.equal(first.intensity, second.intensity);
  assert.equal(first.normalized, second.normalized);
  assert.equal(first.dominantRole, second.dominantRole);
});

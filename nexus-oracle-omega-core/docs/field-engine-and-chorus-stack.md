# 167.89 Field Engine and Chorus Stack

This repo now carries two linked but distinct layers:

## 1. `/lattice` as the 167.89 manifestation engine

The lattice route is the visual-physical simulation layer. It is driven by a local harmonic engine whose fixed shell family is:

- Core: `167.89 Hz`
- Mirror: `335.78 Hz`
- Triad: `503.67 Hz`
- Envelope: `671.56 Hz`
- Telemetry: `839.45 Hz`
- Threshold: `1007.34 Hz`

That engine is built in three connected parts:

1. Multi-node interference math
2. Governed 3D harmonic lattice
3. Real-time shader field

The route-local controls (`freq`, `speed`, `complexity`, `hue`, `reset`, `capture`) only affect this local engine. They do not mutate the broader Codex runtime.

## 2. Chorus Stack as the governance and control layer

The Chorus stack is the deterministic domain layer that governs truth, interpretation, trust, and constrained assignment:

- **Chorus Core** records procedural truth and terminal closure.
- **SAP Engine** models semantic arbitration and semantic lock.
- **RTTS Evidence** emits trust signals without making assignment decisions.
- **Control Kernel** decides operating mode.
- **Assignment Engine** plans assignments while obeying mode and freeze rules.

The stack is intentionally local-first in this repo:

- shared types
- executable kernel logic
- deterministic assignment logic
- server-side simulation endpoints
- tests
- documentation

## 3. Boundary between the layers

The field engine is not the governance engine.

- The field engine answers: how should the harmonic system manifest visually and spatially?
- The Chorus stack answers: how should constrained action, semantic lock, trust evidence, and protected operating modes behave?

The two are presented together so the operator can see a visible field and a legible control model at the same time, but they remain separate authorities.

## 4. Future deployment constraints

This implementation does **not** yet solve:

- distributed time synchronization
- identity / Sybil resistance
- staking, slashing, or economic incentives

Those concerns are deployment-layer work, not part of this local deterministic implementation.

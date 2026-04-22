# Nonagram Codex

**Type:** Nine-plate recursive operator engine  
**Status:** Sealed (immutable architecture)  
**Author:** Mohammad Saad Younus

## Contents

- `spec/nonagram-codex.tla` — TLA+ specification (states, transitions, invariants)
- `schemas/nonagram-codex.schema.json` — JSON Schema for the Codex module
- `src/nonagram-codex.ts` — TypeScript runtime engine
- `diagrams/nonagram-codex.dot` — Graphviz transition diagram
- `prompt/nonagram-codex.prompt.md` — Copilot-ready prompt contract
- `manifest.json` — Bundle manifest and integrity metadata

## Core Model

- 9 plates (I–IX) as states
- 9 operators (generate, structure, scale, disturb, order, merge, invoke, cycle, resolve)
- Fixed transition graph (Nonagram)
- Infinity Core (∞) as fixed point
- Concentric rings as constraints
- Spiral/fractal as regulators

## Invariants

- Plate ordering is immutable
- Every cycle returns to ∞
- Seal = true → architecture locked
- No operator may modify the transition graph

## Usage

- Use `src/nonagram-codex.ts` to embed the engine in applications.
- Use `prompt/nonagram-codex.prompt.md` to guide Copilot when querying or simulating the Codex.

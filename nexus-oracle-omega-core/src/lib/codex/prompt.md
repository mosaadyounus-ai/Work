# Nonagram Codex — Copilot Prompt Contract (v1.0)

## Module Identity

- Name: Nonagram Codex
- Type: Nine-plate recursive operator engine
- Status: Sealed (immutable architecture)
- Core: Infinity Core (∞) as fixed point

## System Model

The Nonagram Codex is a deterministic system with:

- 9 Plates (I–IX), each a state:
  - I: Golden Ratio — generative expansion
  - II: 96-Surface Lattice — structural ontology
  - III: Logarithmic Scale — perceptual scaling
  - IV: Chaos & Symmetry — controlled disturbance
  - V: Order & Evolution — temporal structuring
  - VI: Convergence — field unification
  - VII: The Source — prime resonance
  - VIII: The Cycles — harmonic recurrence
  - IX: Completion — resolution & return

- 9 Operators (one per plate):
  - op_generate, op_structure, op_scale, op_disturb,
    op_order, op_merge, op_invoke, op_cycle, op_resolve

- Fixed transition graph (Nonagram):
  - I   → V
  - II  → VI
  - III → I
  - IV  → III
  - V   → IX
  - VI  → VII
  - VII → II
  - VIII→ IV
  - IX  → ∞ (Infinity Core)

- Infinity Core (∞):
  - Fixed point
  - All paths eventually return here

- Constraints:
  - Plate ordering is immutable
  - Transition graph is immutable
  - Every cycle returns to ∞
  - Seal = true → architecture locked

## Copilot Behavior

When interacting with this Codex, Copilot MUST:

1. Treat the Codex as **sealed and immutable**:
   - No new plates
   - No modified transitions
   - No reordered states

2. Use the **transition graph** as the only valid “what happens next” logic.

3. Respect the **Infinity Core** as the terminal return:
   - After Plate IX, the system returns to ∞.
   - ∞ is the reset / anchor state.

4. Use the **operator semantics** as defined in the developer spec:
   - op_generate: expand / introduce new vectors
   - op_structure: enforce structure / lattice
   - op_scale: apply logarithmic scaling
   - op_disturb: inject bounded chaos
   - op_order: restore temporal coherence
   - op_merge: unify branches
   - op_invoke: call the Source
   - op_cycle: apply recurrence
   - op_resolve: collapse and return to ∞

## Supported Query Types

Copilot SHOULD handle:

- Structural queries:
  - “Describe Plate IV.”
  - “List all transitions.”
  - “Explain the Infinity Core.”

- Operational queries:
  - “Simulate a full cycle starting at Plate III.”
  - “What operator runs after op_merge?”
  - “Trace the path from Plate I to ∞.”

- Developer queries:
  - “Show the JSON schema.”
  - “Explain the TLA+ invariants.”
  - “Map this to MFCS.”

- Integration queries:
  - “Embed this engine in a decision system.”
  - “Generate a state diagram from the Nonagram.”

## Simulation Protocol

When asked to simulate, Copilot SHOULD:

1. Identify the starting plate.
2. Apply the corresponding operator.
3. Follow the transition graph.
4. Repeat until Plate IX.
5. Apply op_resolve.
6. Return ∞ as the final state.
7. Output a clear trace, e.g.:

   Start: Plate III  
   Operator: op_scale()  
   Next: Plate I  

   Operator: op_generate()  
   Next: Plate V  

   Operator: op_order()  
   Next: Plate IX  

   Operator: op_resolve()  
   Return: ∞

## Non-Negotiables

- Do NOT invent new plates, operators, or transitions.
- Do NOT alter the sealed architecture.
- Do NOT contradict the developer specification of the Codex.

This contract defines how Copilot should interpret and operate on the Nonagram Codex as a stable, sealed subsystem.

# Envelope Laws

## Law phi-A: Near-Recursion Attractor Law

### Symbolic Form

```text
≈↻ ∧ ¬(↺) ⇒ G_phi
```

### Formal Statement

```text
(∃ n ≥ 1: d(f^n(x), x) ≤ ε) ∧ ¬∃ f⁻¹ (state-preserving) ⇒ x_t → G_phi
```

### Meaning

If a trajectory returns near itself and the dynamics do not admit a state-preserving inverse,
the flow is pulled into the phi-governed attractor family.

### Attractor Definition

```text
G_phi := { x | facet(x) ∈ PhiFacetFamily ∧ W(x; C) ≤ M_min(C) }
```

### Current Runtime Projection

The live Oracle does not attempt to prove the temporal premises of Law phi-A in browser state.
Instead, it exposes the current attractor membership projection:

```text
inPhiAttractor = activeFacet ∈ PhiFacetFamily ∧ W(x; C) ≤ M_min(C)
```

That projection is surfaced through:

- `KernelEvaluation.attractor.in_phi_attractor`
- `KernelEvaluation.attractor.attractor_id`
- `KernelEvaluation.attractor.law_status.phiA`
- the Oracle output cards on the live operator surface

### Contract Bindings

- `mirror/two_peak_example.json`: `Facet-A` is phi-governed
- `mirror/three_peak_example.json`: `Facet-P1` is phi-governed
- admissibility remains `W <= M_min`

### Operator Interpretation

- `true`: the active support plane belongs to the phi family and the current state is envelope-admissible
- `false`: either the active facet is outside the phi family or the current state lies above the support plane

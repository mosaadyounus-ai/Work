# Law phi-A: Near-Recursion Attractor Law

## Formal statement

```text
(exists n >= 1 : d(f^n(x), x) <= epsilon) and no state-preserving inverse => x_t -> G_phi
```

## Compact symbolic form

```text
approx-loop ^ not(reverse) => G_phi
```

## Meaning

- Near-recursion: the orbit of `x` under `f` returns to within `epsilon` of itself after `n` iterations.
- Irreversibility: no state-preserving inverse exists for the active transition.
- Attractor `G_phi`: the set of states that are both phi-facet-dominated and envelope-admissible.

## Oracle definition

```text
G_phi := { x | facet(x) in Phi and W(x; C) <= M_min(C) }
```

Where:
- `Phi = {Facet-A, Facet-C}`
- `W(x; C) = e + C_phi*phi + C_r*r + C_s*s`
- `M_min(C)` is the tight bound from the active supporting plane

## Runtime approximation

The TLA+ layer proves the implication. The kernel uses a bounded runtime approximation to
measure the premises over the available `phi`, `r`, `s`, and `e` coordinates:

- it computes bounded near-recursion over a small local step horizon
- it computes irreversibility from the active mode
- it computes attractor membership from the active facet and envelope status

This keeps the layers honest:

- spec proves the law
- kernel measures the local runtime state
- UI displays the current consequence and premise status

## System binding

| Layer | Artifact | Property |
|-------|----------|----------|
| Spec | `spec/modules/ConversionFront.tla` | `PhiAttractorProperty` |
| Mirror | `mirror/two_peak_example.json` | `laws[].id = "phi-A"` |
| Kernel | `src/lib/oracleKernelCore.ts` | `inPhiAttractor`, `lawCompliance` |
| UI | `src/pages/OracleWorkbenchPage.tsx` | Attractor and premise indicators |

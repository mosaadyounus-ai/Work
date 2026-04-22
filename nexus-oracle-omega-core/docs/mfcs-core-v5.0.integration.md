# MFCS Core v5.0 — INTEGRATION CANON (Omega Core MK1)

## 1. PURPOSE
MFCS Core v5.0 sits at the heart of the Omega Core strategic pipeline. Its purpose is to provide a deterministic, invariant-guarded decision kernel that prevents ad-hoc, ungrounded, or illegal strategic transitions.

## 2. THE 5-MOVE LOOP
1. **Anchor**: Load current perception context into the Vessel and reset to `IDLE`.
2. **Evaluate**: Filter available strategic options against Invariants and context triggers.
3. **Expand**: Branch or simulate remaining valid options (identity placeholder in v1.0).
4. **Harmonize**: Select the most coherent strategic posture (DEFEND, EXPLOIT, HOLD).
5. **Seal**: Commit the decision, finalize the `State[]` trace, and return the Vessel to `IDLE`.

## 3. STATE MACHINE
- **IDLE**: Waiting for valid context.
- **EVAL**: Options are being filtered and weighted.
- **EXEC**: A decision is being committed to history.

**Allowed Transitions**:
- `IDLE -> EVAL` (Targeted Evaluation)
- `EVAL -> EXEC` (Decision Commitment)
- `EVAL -> IDLE` (Decision Aborted / Null)
- `EXEC -> IDLE` (Final Reset)

## 4. INVARIANTS (The Legal Guardians)
- **T1 (Order)**: No illegal transitions (e.g. `EXEC -> EVAL`).
- **T2 (Timing)**: No decisions on corrupt or missing context.
- **T3 (Continuity)**: No broken arcs (e.g. `IDLE -> EXEC`).
- **M1 (Stability)**: Context must remain non-contradictory.
- **M2 (Coherence)**: Posture must be logically grounded in signal intensity.
- **M4 (Emergence)**: Choices are only valid if triggered by heuristic thresholds.

## 5. CONTRACT
- **Inputs**: `context: { score, risk, config }`, `options: DecisionOption[]`.
- **Outputs**: `chosen: DecisionOption | null`, `trace: State[]`, `status: InvariantResult`.

## 6. AUDIT EXAMPLES
- **DEFEND**: `IDLE -> EVAL -> EXEC -> IDLE` (INV_PASS)
- **NO OP**: `IDLE -> EVAL -> IDLE` (Decision aborted by harmonize/filter)
- **LEAK**: `IDLE -> EVAL -> EXEC` (Audit CRITICAL: state must end in IDLE)

## 7. GUARANTEES & NON-GOALS
- **Guarantee**: The kernel will never produce a state trace that violates the T1/T3 transition rules.
- **Non-Goal**: The kernel does not generate the scores; it only validates the decision *given* the scores.

---
**SEALED: MFCS Core v5.0 is the immutable decision authority for Omega Core MK1.**
**VERSION_TAG: omega-core-mk1-sealed**

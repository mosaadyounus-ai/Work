----------------------------- MODULE ConversionFront_v3 -----------------------------

EXTENDS Naturals, TLC

CONSTANTS 
  K,        \* conversion threshold for phi
  PhiF,     \* fusion phi threshold
  RF,       \* fusion readiness threshold
  SF,       \* fusion stability threshold (NEW)
  C_phi,    \* weight on phi
  C_r,      \* weight on r
  C_s,      \* weight on stability (NEW)
  M_pred    \* envelope bound

VARIABLES mode, e, phi, r, s, integ, dwell, t

vars == << mode, e, phi, r, s, integ, dwell, t >>

Init ==
  /\ mode = "BUILD_COMPRESS"
  /\ e = 0
  /\ phi = 0
  /\ r = 0
  /\ s = 0
  /\ integ = 0
  /\ dwell = 0
  /\ t = 0

BuildCompress ==
  /\ mode = "BUILD_COMPRESS"
  /\ mode' = "BUILD_COMPRESS"
  /\ IF phi >= K
     THEN /\ phi' = phi - 1      \* Rule B: convert phi to r and s
          /\ r'   = r + 4
          /\ s'   = s + 1        \* stability accumulates during conversion
     ELSE /\ phi' = phi + 2      \* Rule A: accumulate phi and r
          /\ r'   = r + 1
          /\ s'   = s
  /\ UNCHANGED <<e, integ, dwell, t>>

CanFuse ==
  /\ phi >= PhiF
  /\ r >= RF
  /\ s >= SF                     \* NEW: stability guard

CompressToFusion ==
  /\ mode = "BUILD_COMPRESS"
  /\ CanFuse
  /\ mode' = "FUSION"
  /\ e' = phi
  /\ UNCHANGED <<phi, r, s, integ, dwell, t>>

FusionStep ==
  /\ mode = "FUSION"
  /\ e > 0
  /\ e' = e - 1
  /\ UNCHANGED <<mode, phi, r, s, integ, dwell, t>>

FusionToCollapse ==
  /\ mode = "FUSION"
  /\ e = 0
  /\ mode' = "COLLAPSE"
  /\ UNCHANGED <<e, phi, r, s, integ, dwell, t>>

CollapseStep ==
  /\ mode = "COLLAPSE"
  /\ r > 0
  /\ r' = r - 1
  /\ UNCHANGED <<mode, e, phi, s, integ, dwell, t>>

Next ==
  \/ BuildCompress
  \/ CompressToFusion
  \/ FusionStep
  \/ FusionToCollapse
  \/ CollapseStep

Spec == Init /\ [][Next]_vars

\* Envelope in 3D weight space: e + C_phi*phi + C_r*r + C_s*s <= M
GlobalEnvelope3D ==
  e + C_phi * phi + C_r * r + C_s * s <= M_pred

TypeOK ==
  /\ mode \in {"BUILD_COMPRESS", "FUSION", "COLLAPSE"}
  /\ e \in Nat
  /\ phi \in Nat
  /\ r \in Nat
  /\ s \in Nat

TimeBound == t <= 25

=============================================================================
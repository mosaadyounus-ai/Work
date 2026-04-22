----------------------------- MODULE ConversionFront -----------------------------

EXTENDS Naturals, TLC

CONSTANTS 
  K,        \* conversion threshold for phi
  PhiF,     \* fusion phi threshold
  RF,       \* fusion readiness threshold
  C_phi,    \* weight on phi in envelope (set to 0 for clean kink)
  C_r,      \* weight on r in envelope
  M_pred    \* envelope bound for verification

VARIABLES mode, e, phi, r, integ, dwell, t

vars == << mode, e, phi, r, integ, dwell, t >>

Init ==
  /\ mode = "BUILD_COMPRESS"
  /\ e = 0
  /\ phi = 0
  /\ r = 0
  /\ integ = 0
  /\ dwell = 0
  /\ t = 0

BuildCompress ==
  /\ mode = "BUILD_COMPRESS"
  /\ mode' = "BUILD_COMPRESS"
  /\ IF phi >= K
     THEN /\ phi' = phi - 1      \* Rule B: siphon phi into r
          /\ r'   = r + 4
     ELSE /\ phi' = phi + 2      \* Rule A: accumulate both
          /\ r'   = r + 1
  /\ UNCHANGED <<e, integ, dwell, t>>

CanFuse ==
  /\ phi >= PhiF
  /\ r >= RF

CompressToFusion ==
  /\ mode = "BUILD_COMPRESS"
  /\ CanFuse
  /\ mode' = "FUSION"
  /\ e' = phi                    \* e becomes integration constant
  /\ UNCHANGED <<phi, r, integ, dwell, t>>

FusionStep ==
  /\ mode = "FUSION"
  /\ e > 0
  /\ e' = e - 1
  /\ UNCHANGED <<mode, phi, r, integ, dwell, t>>

FusionToCollapse ==
  /\ mode = "FUSION"
  /\ e = 0
  /\ mode' = "COLLAPSE"
  /\ UNCHANGED <<e, phi, r, integ, dwell, t>>

CollapseStep ==
  /\ mode = "COLLAPSE"
  /\ r > 0
  /\ r' = r - 1
  /\ UNCHANGED <<mode, e, phi, integ, dwell, t>>

Next ==
  \/ BuildCompress
  \/ CompressToFusion
  \/ FusionStep
  \/ FusionToCollapse
  \/ CollapseStep

Spec == Init /\ [][Next]_vars

\* Invariant: envelope bound
GlobalEnvelope2D ==
  e + C_phi * phi + C_r * r <= M_pred

\* Sanity checks
TypeOK ==
  /\ mode \in {"BUILD_COMPRESS", "FUSION", "COLLAPSE"}
  /\ e \in Nat
  /\ phi \in Nat
  /\ r \in Nat

\* Bounded search
TimeBound == t <= 20

===============================================================================

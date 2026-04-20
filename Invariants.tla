----------------------------- MODULE Invariants -----------------------------

EXTENDS EnvelopeLaws

(* Envelope invariant for all reachable states *)
EnvelopeOK ==
  EnvelopeLaws!EnvelopeInvariant

(* Core system invariant *)
Inv ==
  TypeOK /\ OutputWellFormed /\ EnvelopeOK

(* Mode-specific safety property *)
EnvelopeSafety ==
  [](mode = "FUSION" => EnvelopeLaws!InEnvelope([phi |-> phi, r |-> r, e |-> e]))

===============================================================================
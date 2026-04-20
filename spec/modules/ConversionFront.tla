----------------------------- MODULE ConversionFront -----------------------------
EXTENDS Naturals, TLC

CONSTANTS K, PhiF, RF, SF

VARIABLES phi, r, s, e, mode

(* --algorithm ConversionFront
variables phi \in 0..10, r \in 0..10, s \in 0..10, e \in 0..10, mode \in {"BUILD_COMPRESS", "FUSION", "HOLD"};
begin
  while (TRUE) do
    if mode = "BUILD_COMPRESS" then
      if phi >= K then
        phi := phi - 1;
        r := r + 4;
        s := s + 1;  \* stability accumulates during conversion
      else
        phi := phi + 2;
        r := r + 1;
        s := s;
      end if;
    else
      skip;
    end if;
    e := phi + r + s; \* Example energy update
    if phi = PhiF /\ r = RF /\ s = SF then
      mode := "FUSION";
    end if;
  end while;
end algorithm; *)

Init ==
  /\ phi \in 0..10
  /\ r \in 0..10
  /\ s \in 0..10
  /\ e \in 0..10
  /\ mode \in {"BUILD_COMPRESS", "FUSION", "HOLD"}

Next ==
  IF mode = "BUILD_COMPRESS" THEN
    IF phi >= K THEN
      /\ phi' = phi - 1
      /\ r' = r + 4
      /\ s' = s + 1
      /\ e' = phi' + r' + s'
      /\ mode' = IF phi' = PhiF /\ r' = RF /\ s' = SF THEN "FUSION" ELSE mode
    ELSE
      /\ phi' = phi + 2
      /\ r' = r + 1
      /\ s' = s
      /\ e' = phi' + r' + s'
      /\ mode' = IF phi' = PhiF /\ r' = RF /\ s' = SF THEN "FUSION" ELSE mode
    END IF
  ELSE
    /\ phi' = phi
    /\ r' = r
    /\ s' = s
    /\ e' = e
    /\ mode' = mode
  END IF

================================================================================
import { ChorusEvent, ChorusTx } from "./shared-types";

export function reduceChorusTx(tx: ChorusTx, event: ChorusEvent): ChorusTx {
  switch (event.type) {
    case "SIGN":
      return {
        ...tx,
        signatures: Math.max(tx.signatures, event.signatures ?? tx.signatures),
      };
    case "EXECUTE":
      return {
        ...tx,
        status: tx.signatures > 0 ? "EXECUTED" : "REJECTED",
        recordedAt: event.now ?? tx.recordedAt,
      };
    case "REJECT":
      return {
        ...tx,
        status: "REJECTED",
        recordedAt: event.now ?? tx.recordedAt,
      };
    case "TIMEOUT":
      return {
        ...tx,
        status: "TIMEOUT_RESOLVED",
        recordedAt: event.now ?? tx.recordedAt,
      };
  }
}

export function hasTerminalClosure(tx: ChorusTx) {
  return tx.status !== "REGISTERED";
}

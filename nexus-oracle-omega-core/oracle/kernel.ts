import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  HybridState,
  KernelEvaluation,
  MirrorContract,
  OracleKernelCore,
} from "../src/lib/oracleKernelCore";

export class OracleKernel extends OracleKernelCore {
  constructor(mirrorPathOrContract: string | MirrorContract) {
    if (typeof mirrorPathOrContract === "string") {
      const raw = readFileSync(resolve(mirrorPathOrContract), "utf-8");
      const contract = JSON.parse(raw) as MirrorContract;
      super(contract);
      return;
    }

    super(mirrorPathOrContract);
  }
}

export type { HybridState, KernelEvaluation, MirrorContract };

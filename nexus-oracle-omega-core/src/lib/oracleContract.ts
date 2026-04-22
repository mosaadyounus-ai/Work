import twoPeakMirrorContractData from "../../mirror/two_peak_example.json";
import threePeakMirrorContractData from "../../mirror/three_peak_example.json";
import { MirrorContract, OracleKernelCore } from "./oracleKernelCore";

export type OracleContractKey = "two-peak" | "three-peak";

export const twoPeakMirrorContract = twoPeakMirrorContractData as unknown as MirrorContract;
export const threePeakMirrorContract = threePeakMirrorContractData as unknown as MirrorContract;

export const oracleContracts: Record<OracleContractKey, MirrorContract> = {
  "two-peak": twoPeakMirrorContract,
  "three-peak": threePeakMirrorContract,
};

export const oracleKernels: Record<OracleContractKey, OracleKernelCore> = {
  "two-peak": new OracleKernelCore(twoPeakMirrorContract),
  "three-peak": new OracleKernelCore(threePeakMirrorContract),
};

export const oracleMirrorContract = twoPeakMirrorContract;
export const oracleKernel = oracleKernels["two-peak"];

export function getOracleKernel(contractKey: OracleContractKey) {
  return oracleKernels[contractKey];
}

export function getOracleContract(contractKey: OracleContractKey) {
  return oracleContracts[contractKey];
}

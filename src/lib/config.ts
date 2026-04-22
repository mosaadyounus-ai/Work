import { Config } from "./types";

export const config: Config = {
  riskTolerance: 0.6,     // 0 = defensive, 1 = aggressive
  alertSensitivity: 0.7,  // threshold for alerts
  focus: [
    "Financial Markets",
    "Supply Chain",
    "Technology / AI",
    "Energy",
    "Security / Defense"
  ]
};

import { Signal, Scenario } from "./types";

export function simulate(signal: Signal): Scenario[] {
  // Use absolute momentum for base intensity, keep direction for impact direction
  const intensity = Math.abs(signal.momentum);
  
  const base: Scenario = {
    name: "Base",
    probability: 0.5,
    impact: signal.momentum * 40
  };
  const accel: Scenario = {
    name: "Acceleration",
    probability: 0.25,
    impact: signal.momentum * 90
  };
  const disruption: Scenario = {
    name: "Disruption",
    probability: 0.2,
    impact: -signal.volatility * 110
  };
  const extreme: Scenario = {
    name: "Extreme",
    probability: 0.05,
    impact: -180
  };
  return [base, accel, disruption, extreme];
}

"""Unit tests for rtts_simulation.py"""

import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from rtts_simulation import Outcome, Scenario, run_scenario, simulate


class TestRunScenario(unittest.TestCase):
    def test_baseline_scenario_no_containment(self):
        s = Scenario("baseline", contamination=0.07, load=120, survivor_bias=0.01)
        result = run_scenario(s)
        # measured = max(0, 0.07 - 0.01) = 0.06
        self.assertAlmostEqual(result.measured_contamination, 0.06)
        # confidence_drift = min(1.0, 0.06 * 1.2 + 120/1000) = min(1.0, 0.072 + 0.12) = 0.192
        self.assertAlmostEqual(result.confidence_drift, 0.192)
        self.assertFalse(result.containment_triggered)

    def test_overload_scenario_triggers_containment_via_confidence_drift(self):
        s = Scenario("overload", contamination=0.18, load=380, survivor_bias=0.02)
        result = run_scenario(s)
        # measured = max(0, 0.18 - 0.02) = 0.16
        self.assertAlmostEqual(result.measured_contamination, 0.16)
        # confidence_drift = min(1.0, 0.16 * 1.2 + 380/1000) = min(1.0, 0.192 + 0.38) = 0.572
        self.assertAlmostEqual(result.confidence_drift, 0.572)
        # 0.16 < 0.30, but 0.572 > 0.40 → containment triggered
        self.assertTrue(result.containment_triggered)

    def test_survivor_bias_inversion_triggers_containment_via_both(self):
        s = Scenario("survivor_bias_inversion", contamination=0.42, load=240, survivor_bias=-0.08)
        result = run_scenario(s)
        # measured = max(0, 0.42 - (-0.08)) = max(0, 0.50) = 0.50
        self.assertAlmostEqual(result.measured_contamination, 0.50)
        # confidence_drift = min(1.0, 0.50 * 1.2 + 240/1000) = min(1.0, 0.60 + 0.24) = min(1.0, 0.84) = 0.84
        self.assertAlmostEqual(result.confidence_drift, 0.84)
        # 0.50 > 0.30 → containment triggered
        self.assertTrue(result.containment_triggered)

    def test_negative_survivor_bias_increases_measured_contamination(self):
        # negative survivor_bias should increase measured value
        s_pos = Scenario("pos", contamination=0.20, load=0, survivor_bias=0.05)
        s_neg = Scenario("neg", contamination=0.20, load=0, survivor_bias=-0.05)
        pos_result = run_scenario(s_pos)
        neg_result = run_scenario(s_neg)
        self.assertLess(pos_result.measured_contamination, neg_result.measured_contamination)

    def test_measured_contamination_clamped_at_zero(self):
        # survivor_bias > contamination → measured would be negative, clamped to 0
        s = Scenario("over-corrected", contamination=0.05, load=0, survivor_bias=0.20)
        result = run_scenario(s)
        self.assertEqual(result.measured_contamination, 0.0)
        self.assertFalse(result.containment_triggered)

    def test_confidence_drift_clamped_at_one(self):
        # Very high contamination and load → confidence_drift would exceed 1.0
        s = Scenario("extreme", contamination=1.0, load=1000, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertLessEqual(result.confidence_drift, 1.0)

    def test_containment_triggered_by_measured_contamination_above_threshold(self):
        # measured > 0.30 triggers containment regardless of confidence_drift
        s = Scenario("high-contamination", contamination=0.35, load=0, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertGreater(result.measured_contamination, 0.30)
        self.assertTrue(result.containment_triggered)

    def test_containment_triggered_by_confidence_drift_above_threshold(self):
        # measured <= 0.30 but drift > 0.40 still triggers containment
        # measured = 0.10; drift = 0.10 * 1.2 + 500/1000 = 0.12 + 0.50 = 0.62
        s = Scenario("high-drift", contamination=0.10, load=500, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertLessEqual(result.measured_contamination, 0.30)
        self.assertGreater(result.confidence_drift, 0.40)
        self.assertTrue(result.containment_triggered)

    def test_containment_not_triggered_when_both_below_threshold(self):
        # measured = 0.05, drift = 0.05*1.2 + 0/1000 = 0.06 — both below thresholds
        s = Scenario("safe", contamination=0.05, load=0, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertLessEqual(result.measured_contamination, 0.30)
        self.assertLessEqual(result.confidence_drift, 0.40)
        self.assertFalse(result.containment_triggered)

    def test_outcome_name_matches_scenario_name(self):
        s = Scenario("my-scenario", contamination=0.1, load=100, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertEqual(result.name, "my-scenario")

    def test_zero_load_gives_only_contamination_component_in_drift(self):
        # load=0 → drift = measured * 1.2 only
        s = Scenario("zero-load", contamination=0.10, load=0, survivor_bias=0.0)
        result = run_scenario(s)
        # measured = 0.10, drift = 0.10 * 1.2 + 0/1000 = 0.12
        self.assertAlmostEqual(result.confidence_drift, 0.12)

    def test_zero_contamination_gives_load_only_drift(self):
        # measured=0, drift = 0 * 1.2 + load/1000
        s = Scenario("zero-contamination", contamination=0.0, load=200, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertAlmostEqual(result.measured_contamination, 0.0)
        self.assertAlmostEqual(result.confidence_drift, 0.2)

    def test_boundary_measured_contamination_exactly_at_threshold(self):
        # measured == 0.30 should NOT trigger containment (condition is >0.30)
        s = Scenario("boundary-measured", contamination=0.30, load=0, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertAlmostEqual(result.measured_contamination, 0.30)
        # drift = 0.30 * 1.2 = 0.36, below 0.40 threshold
        self.assertAlmostEqual(result.confidence_drift, 0.36)
        self.assertFalse(result.containment_triggered)

    def test_boundary_confidence_drift_exactly_at_threshold(self):
        # Need drift == 0.40 exactly: measured*1.2 + load/1000 = 0.40
        # Let measured=0.20 → 0.20*1.2=0.24; load = (0.40-0.24)*1000 = 160
        s = Scenario("boundary-drift", contamination=0.20, load=160, survivor_bias=0.0)
        result = run_scenario(s)
        self.assertAlmostEqual(result.confidence_drift, 0.40, places=10)
        self.assertFalse(result.containment_triggered)


class TestSimulate(unittest.TestCase):
    def test_simulate_returns_one_outcome_per_scenario(self):
        scenarios = [
            Scenario("s1", contamination=0.1, load=100, survivor_bias=0.0),
            Scenario("s2", contamination=0.2, load=200, survivor_bias=0.0),
            Scenario("s3", contamination=0.3, load=300, survivor_bias=0.0),
        ]
        outcomes = simulate(scenarios)
        self.assertEqual(len(outcomes), 3)

    def test_simulate_returns_outcomes_in_same_order_as_scenarios(self):
        scenarios = [
            Scenario("alpha", contamination=0.05, load=50, survivor_bias=0.0),
            Scenario("beta", contamination=0.25, load=250, survivor_bias=0.0),
        ]
        outcomes = simulate(scenarios)
        self.assertEqual(outcomes[0].name, "alpha")
        self.assertEqual(outcomes[1].name, "beta")

    def test_simulate_returns_list_of_outcome_instances(self):
        scenarios = [Scenario("s", contamination=0.1, load=100, survivor_bias=0.0)]
        outcomes = simulate(scenarios)
        self.assertIsInstance(outcomes, list)
        self.assertIsInstance(outcomes[0], Outcome)

    def test_simulate_empty_scenarios_returns_empty_list(self):
        outcomes = simulate([])
        self.assertEqual(outcomes, [])

    def test_simulate_single_scenario_matches_run_scenario(self):
        s = Scenario("solo", contamination=0.15, load=300, survivor_bias=0.03)
        direct = run_scenario(s)
        via_simulate = simulate([s])
        self.assertEqual(len(via_simulate), 1)
        self.assertEqual(via_simulate[0].name, direct.name)
        self.assertAlmostEqual(via_simulate[0].measured_contamination, direct.measured_contamination)
        self.assertAlmostEqual(via_simulate[0].confidence_drift, direct.confidence_drift)
        self.assertEqual(via_simulate[0].containment_triggered, direct.containment_triggered)

    def test_simulate_accepts_generator(self):
        # simulate accepts any Iterable, including generator expressions
        gen = (Scenario(f"s{i}", contamination=0.1 * i, load=100, survivor_bias=0.0) for i in range(1, 4))
        outcomes = simulate(gen)
        self.assertEqual(len(outcomes), 3)

    def test_simulate_canonical_scenarios_match_expected_values(self):
        # The three canonical scenarios used in main()
        scenarios = [
            Scenario("baseline", contamination=0.07, load=120, survivor_bias=0.01),
            Scenario("overload", contamination=0.18, load=380, survivor_bias=0.02),
            Scenario("survivor_bias_inversion", contamination=0.42, load=240, survivor_bias=-0.08),
        ]
        outcomes = simulate(scenarios)

        baseline, overload, inversion = outcomes

        self.assertFalse(baseline.containment_triggered)
        self.assertTrue(overload.containment_triggered)
        self.assertTrue(inversion.containment_triggered)

        # baseline: measured = 0.06, drift = 0.192
        self.assertAlmostEqual(baseline.measured_contamination, 0.06)
        self.assertAlmostEqual(baseline.confidence_drift, 0.192)

        # overload: measured = 0.16, drift = 0.572
        self.assertAlmostEqual(overload.measured_contamination, 0.16)
        self.assertAlmostEqual(overload.confidence_drift, 0.572)

        # inversion: measured = 0.50, drift = 0.84
        self.assertAlmostEqual(inversion.measured_contamination, 0.50)
        self.assertAlmostEqual(inversion.confidence_drift, 0.84)


if __name__ == "__main__":
    unittest.main()
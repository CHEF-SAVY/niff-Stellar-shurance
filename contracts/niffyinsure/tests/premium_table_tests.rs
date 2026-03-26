#![cfg(test)]

use niffyinsure::{
    premium::{compute_premium, default_multiplier_table},
    types::{AgeBand, CoverageType, RegionTier, RiskInput},
};
use soroban_sdk::Env;

#[test]
fn default_table_matches_known_reference_vectors() {
    let env = Env::default();
    let table = default_multiplier_table(&env);

    let cases = [
        (
            RiskInput {
                region: RegionTier::Medium,
                age_band: AgeBand::Adult,
                coverage: CoverageType::Standard,
                safety_score: 0,
            },
            10_000_000i128,
            10_000_000i128,
        ),
        (
            RiskInput {
                region: RegionTier::High,
                age_band: AgeBand::Young,
                coverage: CoverageType::Premium,
                safety_score: 80,
            },
            12_345_678i128,
            22_749_999i128,
        ),
        (
            RiskInput {
                region: RegionTier::Low,
                age_band: AgeBand::Senior,
                coverage: CoverageType::Basic,
                safety_score: 100,
            },
            5_000_000i128,
            3_519_000i128,
        ),
    ];

    for (input, base_amount, expected_total) in cases {
        let computation = compute_premium(&input, base_amount, &table).unwrap();
        assert_eq!(computation.total_premium, expected_total);
    }
}

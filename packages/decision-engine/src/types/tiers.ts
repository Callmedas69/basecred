/**
 * Tier and Capability Types with Explicit Ordering
 * 
 * These types represent normalized reputation levels and capabilities.
 * IMPORTANT: Never use string comparison (>=) on Tier values directly.
 * Always use tierGte(), tierLt(), or equivalent numeric comparison.
 */

// ============================================================================
// Tier Types (for trust/social signals)
// ============================================================================

export type Tier = "VERY_LOW" | "LOW" | "NEUTRAL" | "HIGH" | "VERY_HIGH"

/**
 * Explicit ordering for Tier comparisons (ascending)
 * VERY_LOW (0) < LOW (1) < NEUTRAL (2) < HIGH (3) < VERY_HIGH (4)
 */
export const TIER_ORDER: Record<Tier, number> = {
  VERY_LOW: 0,
  LOW: 1,
  NEUTRAL: 2,
  HIGH: 3,
  VERY_HIGH: 4,
}

// ============================================================================
// Capability Types (for builder/creator skills)
// ============================================================================

export type Capability = "EXPLORER" | "BUILDER" | "EXPERT" | "ELITE"

/**
 * Explicit ordering for Capability comparisons (ascending)
 * EXPLORER (0) < BUILDER (1) < EXPERT (2) < ELITE (3)
 */
export const CAPABILITY_ORDER: Record<Capability, number> = {
  EXPLORER: 0,
  BUILDER: 1,
  EXPERT: 2,
  ELITE: 3,
}

// ============================================================================
// Comparison Helpers
// ============================================================================

/**
 * Check if Tier a is greater than or equal to Tier b
 * @example tierGte("HIGH", "NEUTRAL") // true
 * @example tierGte("LOW", "HIGH") // false
 */
export function tierGte(a: Tier, b: Tier): boolean {
  return TIER_ORDER[a] >= TIER_ORDER[b]
}

/**
 * Check if Tier a is less than Tier b
 * @example tierLt("LOW", "HIGH") // true
 * @example tierLt("HIGH", "NEUTRAL") // false
 */
export function tierLt(a: Tier, b: Tier): boolean {
  return TIER_ORDER[a] < TIER_ORDER[b]
}

/**
 * Check if Tier a is greater than Tier b
 */
export function tierGt(a: Tier, b: Tier): boolean {
  return TIER_ORDER[a] > TIER_ORDER[b]
}

/**
 * Check if Tier a is less than or equal to Tier b
 */
export function tierLte(a: Tier, b: Tier): boolean {
  return TIER_ORDER[a] <= TIER_ORDER[b]
}

/**
 * Check if Capability a is greater than or equal to Capability b
 * @example capabilityGte("EXPERT", "ADVANCED") // true
 * @example capabilityGte("NONE", "INTERMEDIATE") // false
 */
export function capabilityGte(a: Capability, b: Capability): boolean {
  return CAPABILITY_ORDER[a] >= CAPABILITY_ORDER[b]
}

/**
 * Check if Capability a is less than Capability b
 */
export function capabilityLt(a: Capability, b: Capability): boolean {
  return CAPABILITY_ORDER[a] < CAPABILITY_ORDER[b]
}

/**
 * Check if Capability a is greater than Capability b
 */
export function capabilityGt(a: Capability, b: Capability): boolean {
  return CAPABILITY_ORDER[a] > CAPABILITY_ORDER[b]
}

/**
 * Check if Capability a is less than or equal to Capability b
 */
export function capabilityLte(a: Capability, b: Capability): boolean {
  return CAPABILITY_ORDER[a] <= CAPABILITY_ORDER[b]
}

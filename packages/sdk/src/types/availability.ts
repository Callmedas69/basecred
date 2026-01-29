/**
 * Availability states. Each source declares exactly one state.
 */
export type AvailabilityState =
  | 'available'    // profile exists and data fetched
  | 'not_found'    // no profile exists
  | 'unlinked'     // identity exists but is not linked
  | 'error';       // API error or failure

export interface Availability {
  ethos: AvailabilityState;
  talent: AvailabilityState;
  farcaster?: AvailabilityState;  // Optional: only present when farcaster.enabled
}

// Client
export { BasecredAgent } from "./client"
export { Registration } from "./registration"

// Errors
export {
  BasecredError,
  AuthError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
  ServerError,
  NetworkError,
} from "./errors"

// Types
export type {
  BasecredAgentConfig,
  PublicRequestOptions,
  RegisterAgentInput,
  RegisterAgentResponse,
  RegistrationStatusValue,
  RegistrationStatus,
  PollOptions,
  Tier,
  Capability,
  NormalizedSignals,
  ContractProofStrings,
  OnChainStatus,
  ContextResult,
  ReputationResult,
  ContextInfo,
  PolicyInfo,
  FeedEntry,
  OutcomeBreakdown,
  ContextBreakdown,
  ProtocolStats,
} from "./types"

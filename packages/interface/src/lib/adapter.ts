import { UnifiedProfileData } from "basecred-decision-engine";
import { UnifiedProfile } from "basecred-sdk";

export function adaptSdkToEngine(
  sdkProfile: UnifiedProfile,
): UnifiedProfileData {
  return {
    ethos: adaptEthos(sdkProfile),
    neynar: adaptNeynar(sdkProfile),
    talent: adaptTalent(sdkProfile),
    lastActivityAt: sdkProfile.recency?.lastUpdatedDaysAgo
      ? new Date(Date.now() - sdkProfile.recency.lastUpdatedDaysAgo * 86400000)
      : null,
  };
}

function adaptEthos(profile: UnifiedProfile): any | null {
  if (profile.availability.ethos !== "available" || !profile.ethos) return null;
  return {
    availability: "available",
    credibility_score: profile.ethos.data.score,
  };
}

function adaptNeynar(profile: UnifiedProfile): any | null {
  if (profile.availability.farcaster !== "available" || !profile.farcaster)
    return null;
  return {
    farcaster_user_score: profile.farcaster.data.userScore,
    pfp_url: undefined, // SDK doesn't expose pfp currently
  };
}

function adaptTalent(profile: UnifiedProfile): any | null {
  // Engine expects { builder: { availability, score }, creator: { availability, score } }
  // SDK gives us availability at top level, and data inside facet.

  // Determining availability for sub-facets based on Top Level + Data presence
  const isAvailable =
    profile.availability.talent === "available" && !!profile.talent;

  return {
    builder: {
      availability:
        isAvailable && profile.talent?.data.builderScore !== undefined
          ? "available"
          : "not_found",
      score: profile.talent?.data.builderScore || 0,
    },
    creator: {
      availability:
        isAvailable && profile.talent?.data.creatorScore !== undefined
          ? "available"
          : "not_found",
      score: profile.talent?.data.creatorScore || 0,
    },
  };
}

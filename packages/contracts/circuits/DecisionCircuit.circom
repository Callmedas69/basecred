pragma circom 2.1.6;

include "circomlib/circuits/comparators.circom";

// DecisionCircuit
// Enforces Basecred decision logic with numeric encodings.

template DecisionCircuit() {
    // Public signals
    signal input policyHash;
    signal input contextId;
    signal input decision;

    // Private inputs
    signal input trust;
    signal input socialTrust;
    signal input builder;
    signal input creator;
    signal input recencyDays;
    signal input spamRisk;
    signal input signalCoverageBps;

    // Range checks
    component trustLt5 = LessThan(8);
    trustLt5.in[0] <== trust;
    trustLt5.in[1] <== 5;
    trustLt5.out === 1;

    component socialLt5 = LessThan(8);
    socialLt5.in[0] <== socialTrust;
    socialLt5.in[1] <== 5;
    socialLt5.out === 1;

    component spamLt5 = LessThan(8);
    spamLt5.in[0] <== spamRisk;
    spamLt5.in[1] <== 5;
    spamLt5.out === 1;

    component builderLt4 = LessThan(8);
    builderLt4.in[0] <== builder;
    builderLt4.in[1] <== 4;
    builderLt4.out === 1;

    component creatorLt4 = LessThan(8);
    creatorLt4.in[0] <== creator;
    creatorLt4.in[1] <== 4;
    creatorLt4.out === 1;

    component contextLt5 = LessThan(8);
    contextLt5.in[0] <== contextId;
    contextLt5.in[1] <== 5;
    contextLt5.out === 1;

    component coverageLt10001 = LessThan(32);
    coverageLt10001.in[0] <== signalCoverageBps;
    coverageLt10001.in[1] <== 10001;
    coverageLt10001.out === 1;

    component recencyLtMax = LessThan(32);
    recencyLtMax.in[0] <== recencyDays;
    recencyLtMax.in[1] <== 4294967296;
    recencyLtMax.out === 1;

    // Context equality checks
    component isAllowlist = IsEqual();
    isAllowlist.in[0] <== contextId;
    isAllowlist.in[1] <== 0;

    component isComment = IsEqual();
    isComment.in[0] <== contextId;
    isComment.in[1] <== 1;

    component isPublish = IsEqual();
    isPublish.in[0] <== contextId;
    isPublish.in[1] <== 2;

    component isApply = IsEqual();
    isApply.in[0] <== contextId;
    isApply.in[1] <== 3;

    component isGovernance = IsEqual();
    isGovernance.in[0] <== contextId;
    isGovernance.in[1] <== 4;

    // Helper comparators
    // signalCoverageBps == 0
    component covIsZero = IsEqual();
    covIsZero.in[0] <== signalCoverageBps;
    covIsZero.in[1] <== 0;

    // signalCoverageBps < 5000
    component covLtHalf = LessThan(32);
    covLtHalf.in[0] <== signalCoverageBps;
    covLtHalf.in[1] <== 5000;

    // spamRisk >= HIGH (3)
    component spamLtHigh = LessThan(8);
    spamLtHigh.in[0] <== spamRisk;
    spamLtHigh.in[1] <== 3;
    signal spamGteHigh;
    spamGteHigh <== 1 - spamLtHigh.out;

    // socialTrust < NEUTRAL (2)
    component socialLtNeutral = LessThan(8);
    socialLtNeutral.in[0] <== socialTrust;
    socialLtNeutral.in[1] <== 2;

    // trust == VERY_LOW (0)
    component trustIsVeryLow = IsEqual();
    trustIsVeryLow.in[0] <== trust;
    trustIsVeryLow.in[1] <== 0;

    // tierGte comparisons
    signal trustGteNeutral;
    signal trustGteHigh;
    signal socialGteNeutral;
    signal socialGteHigh;

    component trustLtNeutral = LessThan(8);
    trustLtNeutral.in[0] <== trust;
    trustLtNeutral.in[1] <== 2;
    trustGteNeutral <== 1 - trustLtNeutral.out;

    component trustLtHigh = LessThan(8);
    trustLtHigh.in[0] <== trust;
    trustLtHigh.in[1] <== 3;
    trustGteHigh <== 1 - trustLtHigh.out;

    component socialLtNeutral2 = LessThan(8);
    socialLtNeutral2.in[0] <== socialTrust;
    socialLtNeutral2.in[1] <== 2;
    socialGteNeutral <== 1 - socialLtNeutral2.out;

    component socialLtHigh = LessThan(8);
    socialLtHigh.in[0] <== socialTrust;
    socialLtHigh.in[1] <== 3;
    socialGteHigh <== 1 - socialLtHigh.out;

    // capabilityGte comparisons
    signal builderGteBuilder;
    signal builderGteExpert;
    signal creatorGteBuilder;
    signal creatorGteExpert;

    component builderLtBuilder = LessThan(8);
    builderLtBuilder.in[0] <== builder;
    builderLtBuilder.in[1] <== 1;
    builderGteBuilder <== 1 - builderLtBuilder.out;

    component builderLtExpert = LessThan(8);
    builderLtExpert.in[0] <== builder;
    builderLtExpert.in[1] <== 2;
    builderGteExpert <== 1 - builderLtExpert.out;

    component creatorLtBuilder = LessThan(8);
    creatorLtBuilder.in[0] <== creator;
    creatorLtBuilder.in[1] <== 1;
    creatorGteBuilder <== 1 - creatorLtBuilder.out;

    component creatorLtExpert = LessThan(8);
    creatorLtExpert.in[0] <== creator;
    creatorLtExpert.in[1] <== 2;
    creatorGteExpert <== 1 - creatorLtExpert.out;

    // allowlist rules
    component builderIsElite = IsEqual();
    builderIsElite.in[0] <== builder;
    builderIsElite.in[1] <== 3;

    component creatorIsElite = IsEqual();
    creatorIsElite.in[0] <== creator;
    creatorIsElite.in[1] <== 3;

    signal strongBuilderAux;
    strongBuilderAux <== builderGteExpert * socialGteHigh;
    signal allowStrongBuilder;
    allowStrongBuilder <== builderIsElite.out + strongBuilderAux - (builderIsElite.out * strongBuilderAux);

    signal strongCreatorAux;
    strongCreatorAux <== creatorGteExpert * socialGteHigh;
    signal allowStrongCreator;
    allowStrongCreator <== creatorIsElite.out + strongCreatorAux - (creatorIsElite.out * strongCreatorAux);

    signal allowHighTrust;
    allowHighTrust <== trustGteHigh * socialGteHigh;

    signal allowAllowlistInner1;
    allowAllowlistInner1 <== allowStrongBuilder + allowStrongCreator - (allowStrongBuilder * allowStrongCreator);
    signal allowAllowlistInner;
    allowAllowlistInner <== allowAllowlistInner1 + allowHighTrust - (allowAllowlistInner1 * allowHighTrust);
    signal allowAllowlist;
    allowAllowlist <== isAllowlist.out * allowAllowlistInner;

    // comment allow
    signal allowCommentInner;
    allowCommentInner <== trustGteNeutral * socialGteNeutral;
    signal allowComment;
    allowComment <== isComment.out * allowCommentInner;

    // publish allow
    signal allowPublishInner1;
    allowPublishInner1 <== builderGteBuilder + creatorGteBuilder - (builderGteBuilder * creatorGteBuilder);
    signal allowPublishInner2;
    allowPublishInner2 <== trustGteHigh * socialGteHigh;
    signal allowPublishInner;
    allowPublishInner <== allowPublishInner2 * allowPublishInner1;
    signal allowPublish;
    allowPublish <== isPublish.out * allowPublishInner;

    // apply allow
    signal allowApplyInner1;
    allowApplyInner1 <== builderGteExpert + creatorGteExpert - (builderGteExpert * creatorGteExpert);
    signal allowApplyInner;
    allowApplyInner <== trustGteNeutral * allowApplyInner1;
    signal allowApply;
    allowApply <== isApply.out * allowApplyInner;

    // governance allow
    component recencyLt31 = LessThan(32);
    recencyLt31.in[0] <== recencyDays;
    recencyLt31.in[1] <== 31;
    signal recencyLe30;
    recencyLe30 <== recencyLt31.out;

    signal allowGovernanceInner1;
    allowGovernanceInner1 <== trustGteHigh * socialGteNeutral;
    signal allowGovernanceInner2;
    allowGovernanceInner2 <== allowGovernanceInner1 * recencyLe30;
    signal allowGovernance;
    allowGovernance <== isGovernance.out * allowGovernanceInner2;

    // allow-with-limits rules
    component recencyGt14 = LessThan(32);
    recencyGt14.in[0] <== 14;
    recencyGt14.in[1] <== recencyDays;

    signal allowListProbationInactiveInner;
    allowListProbationInactiveInner <== trustGteNeutral * recencyGt14.out;
    signal allowListProbationInactive;
    allowListProbationInactive <== isAllowlist.out * allowListProbationInactiveInner;

    component builderIsExplorer = IsEqual();
    builderIsExplorer.in[0] <== builder;
    builderIsExplorer.in[1] <== 0;

    component creatorIsExplorer = IsEqual();
    creatorIsExplorer.in[0] <== creator;
    creatorIsExplorer.in[1] <== 0;

    signal allowListProbationNewInner1;
    allowListProbationNewInner1 <== trustGteNeutral * socialGteNeutral;
    signal allowListProbationNewInner2;
    allowListProbationNewInner2 <== builderIsExplorer.out * creatorIsExplorer.out;
    signal allowListProbationNewInner3;
    allowListProbationNewInner3 <== allowListProbationNewInner1 * allowListProbationNewInner2;
    signal allowListProbationNew;
    allowListProbationNew <== isAllowlist.out * allowListProbationNewInner3;

    component socialLtLow = LessThan(8);
    socialLtLow.in[0] <== socialTrust;
    socialLtLow.in[1] <== 1;
    signal socialGteLow;
    socialGteLow <== 1 - socialLtLow.out;

    signal allowListProbationMixedInner;
    allowListProbationMixedInner <== trustGteHigh * socialGteLow;
    signal allowListProbationMixed;
    allowListProbationMixed <== isAllowlist.out * allowListProbationMixedInner;

    signal limitCommentNew;
    component covGteHalf = LessThan(32);
    covGteHalf.in[0] <== 4999;
    covGteHalf.in[1] <== signalCoverageBps;
    signal limitCommentNewInner;
    limitCommentNewInner <== socialGteLow * covGteHalf.out;
    limitCommentNew <== isComment.out * limitCommentNewInner;

    signal limitPublishUnverified;
    signal limitPublishUnverifiedInner;
    limitPublishUnverifiedInner <== trustGteNeutral * socialGteNeutral;
    limitPublishUnverified <== isPublish.out * limitPublishUnverifiedInner;

    component recencyGt30 = LessThan(32);
    recencyGt30.in[0] <== 30;
    recencyGt30.in[1] <== recencyDays;

    component recencyLt91 = LessThan(32);
    recencyLt91.in[0] <== recencyDays;
    recencyLt91.in[1] <== 91;
    signal recencyLe90;
    recencyLe90 <== recencyLt91.out;

    signal limitGovernanceInactive;
    signal limitGovernanceInactiveInner1;
    limitGovernanceInactiveInner1 <== trustGteHigh * recencyGt30.out;
    signal limitGovernanceInactiveInner2;
    limitGovernanceInactiveInner2 <== limitGovernanceInactiveInner1 * recencyLe90;
    limitGovernanceInactive <== isGovernance.out * limitGovernanceInactiveInner2;

    // Aggregate matches
    signal fallbackNoSignals;
    fallbackNoSignals <== covIsZero.out;

    signal fallbackPartial;
    fallbackPartial <== covLtHalf.out;

    signal hardDenyInner;
    hardDenyInner <== spamGteHigh + socialLtNeutral.out - (spamGteHigh * socialLtNeutral.out);
    signal hardDeny;
    hardDeny <== hardDenyInner + trustIsVeryLow.out - (hardDenyInner * trustIsVeryLow.out);

    signal allowAnyInner1;
    allowAnyInner1 <== allowAllowlist + allowComment - (allowAllowlist * allowComment);
    signal allowAnyInner2;
    allowAnyInner2 <== allowAnyInner1 + allowPublish - (allowAnyInner1 * allowPublish);
    signal allowAnyInner3;
    allowAnyInner3 <== allowAnyInner2 + allowApply - (allowAnyInner2 * allowApply);
    signal allowAny;
    allowAny <== allowAnyInner3 + allowGovernance - (allowAnyInner3 * allowGovernance);

    signal allowWithLimitsAnyInner1;
    allowWithLimitsAnyInner1 <== allowListProbationInactive + allowListProbationNew - (allowListProbationInactive * allowListProbationNew);
    signal allowWithLimitsAnyInner2;
    allowWithLimitsAnyInner2 <== allowWithLimitsAnyInner1 + allowListProbationMixed - (allowWithLimitsAnyInner1 * allowListProbationMixed);
    signal allowWithLimitsAnyInner3;
    allowWithLimitsAnyInner3 <== allowWithLimitsAnyInner2 + limitCommentNew - (allowWithLimitsAnyInner2 * limitCommentNew);
    signal allowWithLimitsAnyInner4;
    allowWithLimitsAnyInner4 <== allowWithLimitsAnyInner3 + limitPublishUnverified - (allowWithLimitsAnyInner3 * limitPublishUnverified);
    signal allowWithLimitsAny;
    allowWithLimitsAny <== allowWithLimitsAnyInner4 + limitGovernanceInactive - (allowWithLimitsAnyInner4 * limitGovernanceInactive);

    // Priority selection
    signal takeNoSignals;
    takeNoSignals <== fallbackNoSignals;

    signal takePartial;
    takePartial <== (1 - takeNoSignals) * fallbackPartial;

    signal takeHardDenyBase;
    takeHardDenyBase <== (1 - takeNoSignals) * (1 - takePartial);
    signal takeHardDeny;
    takeHardDeny <== takeHardDenyBase * hardDeny;

    signal takeAllowBase;
    takeAllowBase <== takeHardDenyBase * (1 - takeHardDeny);
    signal takeAllow;
    takeAllow <== takeAllowBase * allowAny;

    signal takeAllowWithLimitsBase;
    takeAllowWithLimitsBase <== takeAllowBase * (1 - takeAllow);
    signal takeAllowWithLimits;
    takeAllowWithLimits <== takeAllowWithLimitsBase * allowWithLimitsAny;

    signal takeDefaultDeny;
    takeDefaultDeny <== 1 - (takeNoSignals + takePartial + takeHardDeny + takeAllow + takeAllowWithLimits);

    // Decision encoding: 0=DENY, 1=ALLOW_WITH_LIMITS, 2=ALLOW
    signal computedDecision;
    computedDecision <== (takeAllow * 2) + (takePartial + takeAllowWithLimits) * 1;

    // Enforce computed decision
    decision === computedDecision;
}

component main { public [policyHash, contextId, decision] } = DecisionCircuit();

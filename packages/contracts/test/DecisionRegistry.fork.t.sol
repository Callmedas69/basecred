// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DecisionRegistry} from "../contracts/DecisionRegistry.sol";

/**
 * @title DecisionRegistryUpgradeForkTest
 * @notice Fork tests that simulate the V2 upgrade against real Base mainnet state.
 *         Requires BASE_RPC_URL env var. Run separately from unit tests:
 *         forge test --match-path test/DecisionRegistry.fork.t.sol -vvv
 */
contract DecisionRegistryUpgradeForkTest is Test {
    // ---------------------------------------------------------------
    // Constants — real Base mainnet addresses
    // ---------------------------------------------------------------

    address constant PROXY = 0x53c730CbC9832a31f77B0EF7eD31E0cbAD6501Ab;
    address constant OWNER = 0x867c1a77793765aef230Cba3ee443F6ddeEB8597;
    address constant VERIFIER = 0x66d6647261D5E36AFA61d1a29E2C636351Ecc441;

    // ---------------------------------------------------------------
    // Seed data — must match UpgradeRegistry.s.sol exactly
    // ---------------------------------------------------------------

    uint64 constant TOTAL_DECISIONS = 13;

    // 3 unique subject hashes
    bytes32 constant SUBJECT_0 = 0x8d1e827a5fa8577696a330d9fef6ce8866481e90aabbb2940a5cd3520bb66d9d;
    bytes32 constant SUBJECT_1 = 0xa168167a4b320ada1743d7820e56a8ae0ad4f77e7a13ef57c2a75ad8cb7d8c2d;
    bytes32 constant SUBJECT_2 = 0xd31c915a4e7344d737f23ebdc5138116f2ae316466748f7a1b4ddcd36afbacfc;

    // Outcome counts: DENY=5, ALLOW_WITH_LIMITS=0, ALLOW=8
    uint64 constant DENY_COUNT = 5;
    uint64 constant ALLOW_WITH_LIMITS_COUNT = 0;
    uint64 constant ALLOW_COUNT = 8;

    // Context IDs and their counts
    uint256 constant NUM_CONTEXTS = 5;

    DecisionRegistry private registry;

    // ---------------------------------------------------------------
    // Setup — fork Base mainnet
    // ---------------------------------------------------------------

    function setUp() public {
        vm.createSelectFork(vm.envString("BASE_RPC_URL"));
        registry = DecisionRegistry(PROXY);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    function _seedData()
        internal
        pure
        returns (
            bytes32[] memory subjects,
            uint64[3] memory outcomes,
            bytes32[] memory ctxIds,
            uint64[] memory ctxCounts
        )
    {
        subjects = new bytes32[](3);
        subjects[0] = SUBJECT_0;
        subjects[1] = SUBJECT_1;
        subjects[2] = SUBJECT_2;

        outcomes = [uint64(DENY_COUNT), uint64(ALLOW_WITH_LIMITS_COUNT), uint64(ALLOW_COUNT)];

        ctxIds = new bytes32[](NUM_CONTEXTS);
        ctxIds[0] = bytes32(uint256(0));
        ctxIds[1] = bytes32(uint256(1));
        ctxIds[2] = bytes32(uint256(2));
        ctxIds[3] = bytes32(uint256(3));
        ctxIds[4] = bytes32(uint256(4));

        ctxCounts = new uint64[](NUM_CONTEXTS);
        ctxCounts[0] = 4; // allowlist.general
        ctxCounts[1] = 3; // comment
        ctxCounts[2] = 2; // publish
        ctxCounts[3] = 2; // apply
        ctxCounts[4] = 2; // governance.vote
    }

    function _upgradeProxy() internal returns (DecisionRegistry) {
        (
            bytes32[] memory subjects,
            uint64[3] memory outcomes,
            bytes32[] memory ctxIds,
            uint64[] memory ctxCounts
        ) = _seedData();

        vm.startPrank(OWNER);

        DecisionRegistry newImpl = new DecisionRegistry();
        bytes memory initV2Data = abi.encodeCall(
            DecisionRegistry.initializeV2,
            (subjects, outcomes, ctxIds, ctxCounts, TOTAL_DECISIONS)
        );
        registry.upgradeToAndCall(address(newImpl), initV2Data);

        vm.stopPrank();

        return registry;
    }

    // ---------------------------------------------------------------
    // Tests
    // ---------------------------------------------------------------

    /// @notice Verify pre-upgrade state reads correctly from the fork
    function testPreUpgradeStateIsPreserved() public view {
        assertEq(registry.owner(), OWNER, "owner mismatch");
        assertEq(address(registry.verifier()), VERIFIER, "verifier mismatch");
    }

    /// @notice Simulate the full upgradeToAndCall with seed data and verify stats
    function testUpgradeAndSeedV2() public {
        _upgradeProxy();

        // Verify stats match seed data
        DecisionRegistry.Stats memory s = registry.getStats();
        assertEq(s.totalDecisions, TOTAL_DECISIONS, "totalDecisions mismatch");
        assertEq(s.uniqueSubjectCount, 3, "uniqueSubjectCount mismatch");
        assertEq(s.denyCount, DENY_COUNT, "denyCount mismatch");
        assertEq(s.allowWithLimitsCount, ALLOW_WITH_LIMITS_COUNT, "allowWithLimitsCount mismatch");
        assertEq(s.allowCount, ALLOW_COUNT, "allowCount mismatch");

        // Verify per-context counts
        assertEq(registry.getContextDecisionCount(bytes32(uint256(0))), 4, "context 0 count");
        assertEq(registry.getContextDecisionCount(bytes32(uint256(1))), 3, "context 1 count");
        assertEq(registry.getContextDecisionCount(bytes32(uint256(2))), 2, "context 2 count");
        assertEq(registry.getContextDecisionCount(bytes32(uint256(3))), 2, "context 3 count");
        assertEq(registry.getContextDecisionCount(bytes32(uint256(4))), 2, "context 4 count");

        // Verify ownership and verifier survived the upgrade
        assertEq(registry.owner(), OWNER, "owner changed after upgrade");
        assertEq(address(registry.verifier()), VERIFIER, "verifier changed after upgrade");
    }

    /// @notice After upgrade, submit a new decision and verify counters increment on top of seeded values
    function testPostUpgradeSubmitIncrementsCounters() public {
        _upgradeProxy();

        // Submit a new decision as OWNER (restricted is false, so anyone can submit)
        bytes32 subjectHash = keccak256("fork-test-subject");
        bytes32 context = bytes32(uint256(1)); // "comment" context
        bytes32 policyHash = keccak256("fork-test-policy");
        uint8 decision = 2; // ALLOW

        uint256[3] memory publicSignals = [uint256(policyHash), uint256(context), uint256(decision)];

        // The real verifier will reject zero proofs, so we mock it for this test
        vm.mockCall(
            VERIFIER,
            abi.encodeWithSignature(
                "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[3])"
            ),
            abi.encode(true)
        );

        vm.prank(OWNER);
        registry.submitDecision(
            subjectHash,
            context,
            decision,
            policyHash,
            [uint256(0), uint256(0)],
            [[uint256(0), uint256(0)], [uint256(0), uint256(0)]],
            [uint256(0), uint256(0)],
            publicSignals
        );

        DecisionRegistry.Stats memory s = registry.getStats();
        assertEq(s.totalDecisions, TOTAL_DECISIONS + 1, "totalDecisions should increment");
        assertEq(s.uniqueSubjectCount, 4, "new subject should increment unique count");
        assertEq(s.allowCount, ALLOW_COUNT + 1, "allowCount should increment");
        assertEq(s.denyCount, DENY_COUNT, "denyCount should stay the same");
        assertEq(
            registry.getContextDecisionCount(bytes32(uint256(1))),
            4, // was 3 (comment) + 1 new
            "context 1 count should increment"
        );
    }

    /// @notice After upgrade, calling initializeV2 again must revert
    function testInitializeV2CannotBeCalledAgainOnFork() public {
        _upgradeProxy();

        (
            bytes32[] memory subjects,
            uint64[3] memory outcomes,
            bytes32[] memory ctxIds,
            uint64[] memory ctxCounts
        ) = _seedData();

        vm.prank(OWNER);
        vm.expectRevert(abi.encodeWithSignature("InvalidInitialization()"));
        registry.initializeV2(subjects, outcomes, ctxIds, ctxCounts, TOTAL_DECISIONS);
    }
}

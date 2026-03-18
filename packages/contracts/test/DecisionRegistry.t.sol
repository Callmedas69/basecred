// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {DecisionRegistry} from "../contracts/DecisionRegistry.sol";

contract MockVerifier {
    bool public valid = true;

    function setValid(bool value) external {
        valid = value;
    }

    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[3] calldata
    ) external view returns (bool) {
        return valid;
    }
}

contract DecisionRegistryTest is Test {
    MockVerifier private mockVerifier;
    DecisionRegistry private registry;
    address private owner;

    function setUp() public {
        owner = address(this);
        mockVerifier = new MockVerifier();

        // Deploy through proxy (matches real deployment)
        DecisionRegistry implementation = new DecisionRegistry();
        bytes memory initData = abi.encodeCall(
            DecisionRegistry.initialize,
            (address(mockVerifier), owner)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        registry = DecisionRegistry(address(proxy));
    }

    // ---------------------------------------------------------------
    // Existing tests (adapted for proxy)
    // ---------------------------------------------------------------

    function testSubmitDecisionStoresRecord() public {
        bytes32 subjectHash = keccak256("subject");
        bytes32 context = bytes32(uint256(1));
        bytes32 policyHash = keccak256("policy");
        uint256[3] memory publicSignals = [uint256(policyHash), uint256(context), uint256(1)];

        registry.submitDecision(subjectHash, context, 1, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], publicSignals);

        DecisionRegistry.DecisionRecord memory record = registry.getDecision(subjectHash, context, policyHash);
        assertEq(record.decision, 1);
        assertEq(record.policyHash, policyHash);
        assertEq(record.timestamp > 0, true);
        assertEq(record.submitter, address(this));
    }

    function testAllowsResubmission() public {
        bytes32 subjectHash = keccak256("subject");
        bytes32 context = bytes32(uint256(1));
        bytes32 policyHash = keccak256("policy");

        uint256[3] memory signals1 = [uint256(policyHash), uint256(context), uint256(0)];
        registry.submitDecision(subjectHash, context, 0, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], signals1);

        DecisionRegistry.DecisionRecord memory record1 = registry.getDecision(subjectHash, context, policyHash);
        assertEq(record1.decision, 0);
        uint64 ts1 = record1.timestamp;

        vm.warp(block.timestamp + 100);

        uint256[3] memory signals2 = [uint256(policyHash), uint256(context), uint256(1)];
        registry.submitDecision(subjectHash, context, 1, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], signals2);

        DecisionRegistry.DecisionRecord memory record2 = registry.getDecision(subjectHash, context, policyHash);
        assertEq(record2.decision, 1);
        assertGt(record2.timestamp, ts1);
    }

    function testRejectsPolicyHashMismatch() public {
        bytes32 subjectHash = keccak256("subject");
        bytes32 context = bytes32(uint256(1));
        bytes32 policyHash = keccak256("policy");
        uint256[3] memory publicSignals = [uint256(keccak256("other")), uint256(context), uint256(1)];

        vm.expectRevert("Policy hash mismatch");
        registry.submitDecision(subjectHash, context, 1, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], publicSignals);
    }

    function testRejectsInvalidProof() public {
        bytes32 subjectHash = keccak256("subject");
        bytes32 context = bytes32(uint256(1));
        bytes32 policyHash = keccak256("policy");
        uint256[3] memory publicSignals = [uint256(policyHash), uint256(context), uint256(1)];

        mockVerifier.setValid(false);

        vm.expectRevert("Invalid proof");
        registry.submitDecision(subjectHash, context, 1, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], publicSignals);
    }

    function testRejectsDecisionMismatch() public {
        bytes32 subjectHash = keccak256("subject");
        bytes32 context = bytes32(uint256(1));
        bytes32 policyHash = keccak256("policy");
        uint256[3] memory publicSignals = [uint256(policyHash), uint256(context), uint256(2)];

        vm.expectRevert("Decision mismatch");
        registry.submitDecision(subjectHash, context, 1, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], publicSignals);
    }

    // ---------------------------------------------------------------
    // New tests: Admin events
    // ---------------------------------------------------------------

    function testEmitsVerifierUpdated() public {
        address newVerifier = address(0xBEEF);
        address oldVerifier = address(mockVerifier);

        vm.expectEmit(true, true, false, false);
        emit DecisionRegistry.VerifierUpdated(oldVerifier, newVerifier);

        registry.setVerifier(newVerifier);
    }

    function testEmitsRestrictedChanged() public {
        vm.expectEmit(false, false, false, true);
        emit DecisionRegistry.RestrictedChanged(true);

        registry.setRestricted(true);
    }

    function testEmitsSubmitterAuthorizationChanged() public {
        address submitter = address(0xCAFE);

        vm.expectEmit(true, false, false, true);
        emit DecisionRegistry.SubmitterAuthorizationChanged(submitter, true);

        registry.setAuthorizedSubmitter(submitter, true);
    }

    // ---------------------------------------------------------------
    // New tests: UUPS + ownership
    // ---------------------------------------------------------------

    function testRenounceOwnershipReverts() public {
        vm.expectRevert("Disabled");
        registry.renounceOwnership();
    }

    function testUpgradeOnlyOwner() public {
        DecisionRegistry newImpl = new DecisionRegistry();
        address nonOwner = address(0xDEAD);

        vm.prank(nonOwner);
        vm.expectRevert(
            abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, nonOwner)
        );
        registry.upgradeToAndCall(address(newImpl), "");
    }

    function testOwnershipTransferEmitsEvent() public {
        address newOwner = address(0xBEEF);

        vm.expectEmit(true, true, false, false);
        emit OwnableUpgradeable.OwnershipTransferred(owner, newOwner);

        registry.transferOwnership(newOwner);
    }

    // ---------------------------------------------------------------
    // Additional coverage: access control, initialization, context
    // ---------------------------------------------------------------

    function testRejectsContextMismatch() public {
        bytes32 subjectHash = keccak256("subject");
        bytes32 context = bytes32(uint256(1));
        bytes32 policyHash = keccak256("policy");
        uint256[3] memory publicSignals = [uint256(policyHash), uint256(2), uint256(1)];

        vm.expectRevert("Context id mismatch");
        registry.submitDecision(subjectHash, context, 1, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], publicSignals);
    }

    function testSetVerifierOnlyOwner() public {
        address nonOwner = address(0xDEAD);
        vm.prank(nonOwner);
        vm.expectRevert(
            abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, nonOwner)
        );
        registry.setVerifier(address(0xBEEF));
    }

    function testSetRestrictedOnlyOwner() public {
        address nonOwner = address(0xDEAD);
        vm.prank(nonOwner);
        vm.expectRevert(
            abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, nonOwner)
        );
        registry.setRestricted(true);
    }

    function testSetAuthorizedSubmitterOnlyOwner() public {
        address nonOwner = address(0xDEAD);
        vm.prank(nonOwner);
        vm.expectRevert(
            abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, nonOwner)
        );
        registry.setAuthorizedSubmitter(address(0xCAFE), true);
    }

    function testRestrictedModeBlocksUnauthorized() public {
        registry.setRestricted(true);

        address unauthorized = address(0xDEAD);
        bytes32 subjectHash = keccak256("subject");
        bytes32 context = bytes32(uint256(1));
        bytes32 policyHash = keccak256("policy");
        uint256[3] memory publicSignals = [uint256(policyHash), uint256(context), uint256(1)];

        vm.prank(unauthorized);
        vm.expectRevert("Not authorized");
        registry.submitDecision(subjectHash, context, 1, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], publicSignals);
    }

    function testInitializeCannotBeCalledTwice() public {
        vm.expectRevert(abi.encodeWithSignature("InvalidInitialization()"));
        registry.initialize(address(mockVerifier), owner);
    }

    function testImplementationCannotBeInitialized() public {
        DecisionRegistry impl = new DecisionRegistry();
        vm.expectRevert(abi.encodeWithSignature("InvalidInitialization()"));
        impl.initialize(address(mockVerifier), owner);
    }
}

// =======================================================================
// V2 Tests: On-chain stats counters + initializeV2
// =======================================================================

contract DecisionRegistryV2Test is Test {
    MockVerifier private mockVerifier;
    DecisionRegistry private registry;
    address private owner;

    // Zero proof args (mock verifier always returns true)
    uint256[2] private zeroA = [uint256(0), uint256(0)];
    uint256[2][2] private zeroB = [[uint256(0), uint256(0)], [uint256(0), uint256(0)]];
    uint256[2] private zeroC = [uint256(0), uint256(0)];

    function setUp() public {
        owner = address(this);
        mockVerifier = new MockVerifier();

        // Deploy V1 through proxy, then upgrade to V2 with empty seed
        DecisionRegistry implementation = new DecisionRegistry();
        bytes memory initData = abi.encodeCall(
            DecisionRegistry.initialize,
            (address(mockVerifier), owner)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        registry = DecisionRegistry(address(proxy));
    }

    /// @dev Helper: upgrade proxy to a fresh V2 implementation with seed data
    function _upgradeWithSeed(
        bytes32[] memory subjects,
        uint64[3] memory outcomes,
        bytes32[] memory ctxIds,
        uint64[] memory ctxCounts,
        uint64 total
    ) internal {
        DecisionRegistry newImpl = new DecisionRegistry();
        bytes memory initV2 = abi.encodeCall(
            DecisionRegistry.initializeV2,
            (subjects, outcomes, ctxIds, ctxCounts, total)
        );
        registry.upgradeToAndCall(address(newImpl), initV2);
    }

    /// @dev Helper: submit a decision with minimal boilerplate
    function _submit(bytes32 subjectHash, bytes32 context, uint8 decision, bytes32 policyHash) internal {
        uint256[3] memory signals = [uint256(policyHash), uint256(context), uint256(decision)];
        registry.submitDecision(subjectHash, context, decision, policyHash, zeroA, zeroB, zeroC, signals);
    }

    // ---------------------------------------------------------------
    // Seeding tests
    // ---------------------------------------------------------------

    function testUpgradeAndSeedV2() public {
        bytes32[] memory subjects = new bytes32[](2);
        subjects[0] = keccak256("alice");
        subjects[1] = keccak256("bob");

        uint64[3] memory outcomes = [uint64(3), uint64(1), uint64(6)];

        bytes32[] memory ctxIds = new bytes32[](2);
        ctxIds[0] = bytes32(uint256(0));
        ctxIds[1] = bytes32(uint256(1));
        uint64[] memory ctxCounts = new uint64[](2);
        ctxCounts[0] = 7;
        ctxCounts[1] = 3;

        _upgradeWithSeed(subjects, outcomes, ctxIds, ctxCounts, 10);

        DecisionRegistry.Stats memory s = registry.getStats();
        assertEq(s.totalDecisions, 10);
        assertEq(s.uniqueSubjectCount, 2);
        assertEq(s.denyCount, 3);
        assertEq(s.allowWithLimitsCount, 1);
        assertEq(s.allowCount, 6);

        assertEq(registry.getContextDecisionCount(bytes32(uint256(0))), 7);
        assertEq(registry.getContextDecisionCount(bytes32(uint256(1))), 3);
    }

    function testGetStatsReturnsZerosWithoutSeed() public {
        // Upgrade with empty seed
        bytes32[] memory empty32 = new bytes32[](0);
        uint64[] memory empty64 = new uint64[](0);
        _upgradeWithSeed(empty32, [uint64(0), uint64(0), uint64(0)], empty32, empty64, 0);

        DecisionRegistry.Stats memory s = registry.getStats();
        assertEq(s.totalDecisions, 0);
        assertEq(s.uniqueSubjectCount, 0);
        assertEq(s.denyCount, 0);
        assertEq(s.allowWithLimitsCount, 0);
        assertEq(s.allowCount, 0);
    }

    // ---------------------------------------------------------------
    // Counter increment tests
    // ---------------------------------------------------------------

    function testSubmitDecisionIncrementsCounters() public {
        // Upgrade with empty seed first
        bytes32[] memory empty32 = new bytes32[](0);
        uint64[] memory empty64 = new uint64[](0);
        _upgradeWithSeed(empty32, [uint64(0), uint64(0), uint64(0)], empty32, empty64, 0);

        bytes32 subjectHash = keccak256("alice");
        bytes32 context = bytes32(uint256(1));
        bytes32 policyHash = keccak256("policy");

        _submit(subjectHash, context, 2, policyHash);

        DecisionRegistry.Stats memory s = registry.getStats();
        assertEq(s.totalDecisions, 1);
        assertEq(s.uniqueSubjectCount, 1);
        assertEq(s.allowCount, 1);
        assertEq(s.denyCount, 0);
        assertEq(registry.getContextDecisionCount(context), 1);
    }

    function testResubmissionIncrementsCountersButNotUniqueSubjects() public {
        bytes32[] memory empty32 = new bytes32[](0);
        uint64[] memory empty64 = new uint64[](0);
        _upgradeWithSeed(empty32, [uint64(0), uint64(0), uint64(0)], empty32, empty64, 0);

        bytes32 subjectHash = keccak256("alice");
        bytes32 context = bytes32(uint256(1));
        bytes32 policyHash = keccak256("policy");

        // First submission: DENY
        _submit(subjectHash, context, 0, policyHash);
        // Resubmission (same key): ALLOW
        _submit(subjectHash, context, 2, policyHash);

        DecisionRegistry.Stats memory s = registry.getStats();
        assertEq(s.totalDecisions, 2, "total should count both submissions");
        assertEq(s.uniqueSubjectCount, 1, "same subject should not double-count");
        assertEq(s.denyCount, 1);
        assertEq(s.allowCount, 1);
        assertEq(registry.getContextDecisionCount(context), 2);
    }

    function testUniqueSubjectTrackingAcrossContexts() public {
        bytes32[] memory empty32 = new bytes32[](0);
        uint64[] memory empty64 = new uint64[](0);
        _upgradeWithSeed(empty32, [uint64(0), uint64(0), uint64(0)], empty32, empty64, 0);

        bytes32 subjectHash = keccak256("alice");
        bytes32 context1 = bytes32(uint256(0));
        bytes32 context2 = bytes32(uint256(1));

        _submit(subjectHash, context1, 2, keccak256("policy1"));
        _submit(subjectHash, context2, 0, keccak256("policy2"));

        DecisionRegistry.Stats memory s = registry.getStats();
        assertEq(s.totalDecisions, 2);
        assertEq(s.uniqueSubjectCount, 1, "same subject in different contexts = 1 unique");
        assertEq(registry.getContextDecisionCount(context1), 1);
        assertEq(registry.getContextDecisionCount(context2), 1);
    }

    // ---------------------------------------------------------------
    // Access control & edge cases
    // ---------------------------------------------------------------

    function testInitializeV2CannotBeCalledTwice() public {
        bytes32[] memory empty32 = new bytes32[](0);
        uint64[] memory empty64 = new uint64[](0);
        _upgradeWithSeed(empty32, [uint64(0), uint64(0), uint64(0)], empty32, empty64, 0);

        vm.expectRevert(abi.encodeWithSignature("InvalidInitialization()"));
        registry.initializeV2(empty32, [uint64(0), uint64(0), uint64(0)], empty32, empty64, 0);
    }

    function testInitializeV2OnlyOwner() public {
        DecisionRegistry newImpl = new DecisionRegistry();
        registry.upgradeToAndCall(address(newImpl), "");

        address nonOwner = address(0xDEAD);
        bytes32[] memory empty32 = new bytes32[](0);
        uint64[] memory empty64 = new uint64[](0);

        vm.prank(nonOwner);
        vm.expectRevert(
            abi.encodeWithSelector(OwnableUpgradeable.OwnableUnauthorizedAccount.selector, nonOwner)
        );
        registry.initializeV2(empty32, [uint64(0), uint64(0), uint64(0)], empty32, empty64, 0);
    }

    function testInitializeV2ArrayLengthMismatch() public {
        DecisionRegistry newImpl = new DecisionRegistry();
        registry.upgradeToAndCall(address(newImpl), "");

        bytes32[] memory ctxIds = new bytes32[](2);
        ctxIds[0] = bytes32(uint256(0));
        ctxIds[1] = bytes32(uint256(1));
        uint64[] memory ctxCounts = new uint64[](1);
        ctxCounts[0] = 5;

        bytes32[] memory empty32 = new bytes32[](0);

        vm.expectRevert("Array length mismatch");
        registry.initializeV2(empty32, [uint64(0), uint64(0), uint64(0)], ctxIds, ctxCounts, 0);
    }

    function testGetContextDecisionCountUnknownContext() public {
        bytes32[] memory empty32 = new bytes32[](0);
        uint64[] memory empty64 = new uint64[](0);
        _upgradeWithSeed(empty32, [uint64(0), uint64(0), uint64(0)], empty32, empty64, 0);

        assertEq(registry.getContextDecisionCount(bytes32(uint256(999))), 0);
    }
}

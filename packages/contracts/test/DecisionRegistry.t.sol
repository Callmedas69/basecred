// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";

import { DecisionRegistry } from "../contracts/DecisionRegistry.sol";

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
    MockVerifier private verifier;
    DecisionRegistry private registry;

    function setUp() public {
        verifier = new MockVerifier();
        registry = new DecisionRegistry(address(verifier));
    }

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

        // First submission: decision = 0
        uint256[3] memory signals1 = [uint256(policyHash), uint256(context), uint256(0)];
        registry.submitDecision(subjectHash, context, 0, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], signals1);

        DecisionRegistry.DecisionRecord memory record1 = registry.getDecision(subjectHash, context, policyHash);
        assertEq(record1.decision, 0);
        uint64 ts1 = record1.timestamp;

        // Advance time so timestamps differ
        vm.warp(block.timestamp + 100);

        // Second submission: decision = 1 (same key, different value)
        uint256[3] memory signals2 = [uint256(policyHash), uint256(context), uint256(1)];
        registry.submitDecision(subjectHash, context, 1, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], signals2);

        // Record should reflect the second submission
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

        verifier.setValid(false);

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
}

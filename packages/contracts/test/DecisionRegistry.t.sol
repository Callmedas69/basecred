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
        uint256[] calldata
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

    function testRejectsReplay() public {
        bytes32 subjectHash = keccak256("subject");
        bytes32 context = bytes32(uint256(1));
        bytes32 policyHash = keccak256("policy");
        uint256[3] memory publicSignals = [uint256(policyHash), uint256(context), uint256(1)];

        registry.submitDecision(subjectHash, context, 1, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], publicSignals);

        vm.expectRevert("Decision already submitted");
        registry.submitDecision(subjectHash, context, 1, policyHash, [uint256(0), uint256(0)], [[uint256(0), uint256(0)], [uint256(0), uint256(0)]], [uint256(0), uint256(0)], publicSignals);
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

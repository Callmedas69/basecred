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

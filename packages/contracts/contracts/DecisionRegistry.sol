// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata input
    ) external view returns (bool);
}

contract DecisionRegistry is OwnableUpgradeable, UUPSUpgradeable {
    // ---------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------

    event DecisionSubmitted(
        bytes32 indexed subjectHash,
        bytes32 indexed context,
        uint8 decision,
        bytes32 policyHash,
        uint64 timestamp
    );

    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);
    event RestrictedChanged(bool restricted);
    event SubmitterAuthorizationChanged(address indexed submitter, bool allowed);

    // ---------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------

    struct DecisionRecord {
        uint8 decision;
        bytes32 policyHash;
        uint64 timestamp;
        address submitter;
    }

    struct Stats {
        uint64 totalDecisions;
        uint64 uniqueSubjectCount;
        uint64 denyCount;            // outcome 0
        uint64 allowWithLimitsCount; // outcome 1
        uint64 allowCount;           // outcome 2
    }

    // ---------------------------------------------------------------
    // ERC-7201 Namespaced Storage
    // ---------------------------------------------------------------

    /// @custom:storage-location erc7201:basecred.storage.DecisionRegistry
    struct DecisionRegistryStorage {
        // --- V1 fields (DO NOT REORDER OR REMOVE) ---
        bool restricted;
        IVerifier verifier;
        mapping(address => bool) authorizedSubmitters;
        mapping(bytes32 => DecisionRecord) decisions;
        // --- V2 fields (appended for on-chain stats) ---
        uint64 totalDecisions;
        uint64 uniqueSubjectCount;
        mapping(bytes32 => bool) seenSubjects;
        mapping(uint8 => uint64) decisionsByOutcome;
        mapping(bytes32 => uint64) decisionsByContext;
    }

    // keccak256(abi.encode(uint256(keccak256("basecred.storage.DecisionRegistry")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant STORAGE_LOCATION =
        0x248037f3ad6991c1aac0f6a6f451f8c3c1de9d5de6c49f523f0ec1ca17fca800;

    function _getStorage() private pure returns (DecisionRegistryStorage storage $) {
        assembly {
            $.slot := STORAGE_LOCATION
        }
    }

    // ---------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------

    uint256 public constant POLICY_HASH_SIGNAL_INDEX = 0;
    uint256 public constant CONTEXT_ID_SIGNAL_INDEX = 1;
    uint256 public constant DECISION_SIGNAL_INDEX = 2;

    // ---------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------

    modifier onlyAuthorized() {
        DecisionRegistryStorage storage $ = _getStorage();
        if ($.restricted) {
            require($.authorizedSubmitters[msg.sender], "Not authorized");
        }
        _;
    }

    // ---------------------------------------------------------------
    // Constructor & Initializer
    // ---------------------------------------------------------------

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address verifierAddress, address initialOwner) external initializer {
        require(verifierAddress != address(0), "Invalid verifier");
        require(initialOwner != address(0), "Invalid owner");

        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        DecisionRegistryStorage storage $ = _getStorage();
        $.verifier = IVerifier(verifierAddress);
    }

    /// @notice Seeds stats counters with historical data. Called once during upgrade.
    function initializeV2(
        bytes32[] calldata existingSubjects,
        uint64[3] calldata outcomeCounts,
        bytes32[] calldata contextIds,
        uint64[] calldata contextCounts,
        uint64 totalDecisionCount
    ) external reinitializer(2) onlyOwner {
        require(contextIds.length == contextCounts.length, "Array length mismatch");

        DecisionRegistryStorage storage $ = _getStorage();
        $.totalDecisions = totalDecisionCount;
        $.uniqueSubjectCount = uint64(existingSubjects.length);

        for (uint256 i = 0; i < existingSubjects.length; i++) {
            $.seenSubjects[existingSubjects[i]] = true;
        }

        $.decisionsByOutcome[0] = outcomeCounts[0];
        $.decisionsByOutcome[1] = outcomeCounts[1];
        $.decisionsByOutcome[2] = outcomeCounts[2];

        for (uint256 i = 0; i < contextIds.length; i++) {
            $.decisionsByContext[contextIds[i]] = contextCounts[i];
        }
    }

    // ---------------------------------------------------------------
    // UUPS
    // ---------------------------------------------------------------

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // ---------------------------------------------------------------
    // Owner overrides
    // ---------------------------------------------------------------

    /// @dev Disabled to prevent bricking the upgrade mechanism.
    function renounceOwnership() public pure override {
        revert("Disabled");
    }

    // ---------------------------------------------------------------
    // Admin functions
    // ---------------------------------------------------------------

    function setRestricted(bool value) external onlyOwner {
        DecisionRegistryStorage storage $ = _getStorage();
        $.restricted = value;
        emit RestrictedChanged(value);
    }

    function setAuthorizedSubmitter(address submitter, bool allowed) external onlyOwner {
        DecisionRegistryStorage storage $ = _getStorage();
        $.authorizedSubmitters[submitter] = allowed;
        emit SubmitterAuthorizationChanged(submitter, allowed);
    }

    function setVerifier(address verifierAddress) external onlyOwner {
        require(verifierAddress != address(0), "Invalid verifier");
        DecisionRegistryStorage storage $ = _getStorage();
        address oldVerifier = address($.verifier);
        $.verifier = IVerifier(verifierAddress);
        emit VerifierUpdated(oldVerifier, verifierAddress);
    }

    // ---------------------------------------------------------------
    // Core logic
    // ---------------------------------------------------------------

    function submitDecision(
        bytes32 subjectHash,
        bytes32 context,
        uint8 decision,
        bytes32 policyHash,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata publicSignals
    ) external onlyAuthorized {
        require(subjectHash != bytes32(0), "Invalid subjectHash");
        require(policyHash != bytes32(0), "Invalid policyHash");

        bytes32 key = keccak256(abi.encode(subjectHash, context, policyHash));

        bytes32 policyHashSignal = bytes32(publicSignals[POLICY_HASH_SIGNAL_INDEX]);
        require(policyHashSignal == policyHash, "Policy hash mismatch");

        require(publicSignals[CONTEXT_ID_SIGNAL_INDEX] == uint256(context), "Context id mismatch");

        require(publicSignals[DECISION_SIGNAL_INDEX] == uint256(decision), "Decision mismatch");

        DecisionRegistryStorage storage $ = _getStorage();
        bool ok = $.verifier.verifyProof(a, b, c, publicSignals);
        require(ok, "Invalid proof");

        $.decisions[key] = DecisionRecord({
            decision: decision,
            policyHash: policyHash,
            timestamp: uint64(block.timestamp),
            submitter: msg.sender
        });

        // V2: increment stats counters
        $.totalDecisions++;
        if (!$.seenSubjects[subjectHash]) {
            $.seenSubjects[subjectHash] = true;
            $.uniqueSubjectCount++;
        }
        $.decisionsByOutcome[decision]++;
        $.decisionsByContext[context]++;

        emit DecisionSubmitted(subjectHash, context, decision, policyHash, uint64(block.timestamp));
    }

    // ---------------------------------------------------------------
    // View functions
    // ---------------------------------------------------------------

    function getDecisionKey(
        bytes32 subjectHash,
        bytes32 context,
        bytes32 policyHash
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(subjectHash, context, policyHash));
    }

    function getDecision(
        bytes32 subjectHash,
        bytes32 context,
        bytes32 policyHash
    ) external view returns (DecisionRecord memory) {
        DecisionRegistryStorage storage $ = _getStorage();
        bytes32 key = keccak256(abi.encode(subjectHash, context, policyHash));
        return $.decisions[key];
    }

    function restricted() external view returns (bool) {
        return _getStorage().restricted;
    }

    function verifier() external view returns (IVerifier) {
        return _getStorage().verifier;
    }

    function authorizedSubmitters(address submitter) external view returns (bool) {
        return _getStorage().authorizedSubmitters[submitter];
    }

    /// @notice Returns aggregate protocol stats in a single call.
    function getStats() external view returns (Stats memory) {
        DecisionRegistryStorage storage $ = _getStorage();
        return Stats({
            totalDecisions: $.totalDecisions,
            uniqueSubjectCount: $.uniqueSubjectCount,
            denyCount: $.decisionsByOutcome[0],
            allowWithLimitsCount: $.decisionsByOutcome[1],
            allowCount: $.decisionsByOutcome[2]
        });
    }

    /// @notice Returns the number of decisions for a specific context.
    function getContextDecisionCount(bytes32 context) external view returns (uint64) {
        return _getStorage().decisionsByContext[context];
    }
}

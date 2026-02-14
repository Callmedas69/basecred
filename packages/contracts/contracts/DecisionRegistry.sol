// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVerifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata input
    ) external view returns (bool);
}

contract DecisionRegistry {
    event DecisionSubmitted(
        bytes32 indexed subjectHash,
        bytes32 indexed context,
        uint8 decision,
        bytes32 policyHash,
        uint64 timestamp
    );

    struct DecisionRecord {
        uint8 decision;
        bytes32 policyHash;
        uint64 timestamp;
        address submitter;
    }

    address public owner;
    bool public restricted;
    IVerifier public verifier;

    mapping(address => bool) public authorizedSubmitters;
    mapping(bytes32 => DecisionRecord) public decisions;

    uint256 public constant POLICY_HASH_SIGNAL_INDEX = 0;
    uint256 public constant CONTEXT_ID_SIGNAL_INDEX = 1;
    uint256 public constant DECISION_SIGNAL_INDEX = 2;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        if (restricted) {
            require(authorizedSubmitters[msg.sender], "Not authorized");
        }
        _;
    }

    constructor(address verifierAddress) {
        require(verifierAddress != address(0), "Invalid verifier");
        owner = msg.sender;
        verifier = IVerifier(verifierAddress);
    }

    function setRestricted(bool value) external onlyOwner {
        restricted = value;
    }

    function setAuthorizedSubmitter(address submitter, bool allowed) external onlyOwner {
        authorizedSubmitters[submitter] = allowed;
    }

    function setVerifier(address verifierAddress) external onlyOwner {
        require(verifierAddress != address(0), "Invalid verifier");
        verifier = IVerifier(verifierAddress);
    }

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

        bool ok = verifier.verifyProof(a, b, c, publicSignals);
        require(ok, "Invalid proof");

        decisions[key] = DecisionRecord({
            decision: decision,
            policyHash: policyHash,
            timestamp: uint64(block.timestamp),
            submitter: msg.sender
        });

        emit DecisionSubmitted(subjectHash, context, decision, policyHash, uint64(block.timestamp));
    }

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
        bytes32 key = keccak256(abi.encode(subjectHash, context, policyHash));
        return decisions[key];
    }
}

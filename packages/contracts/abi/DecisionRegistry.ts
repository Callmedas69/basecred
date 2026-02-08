export const DECISION_REGISTRY_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "verifierAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "CONTEXT_ID_SIGNAL_INDEX",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DECISION_SIGNAL_INDEX",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "POLICY_HASH_SIGNAL_INDEX",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "authorizedSubmitters",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "decisions",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "decision",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "policyHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "timestamp",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "submitter",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDecision",
    "inputs": [
      {
        "name": "subjectHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "context",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "policyHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct DecisionRegistry.DecisionRecord",
        "components": [
          {
            "name": "decision",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "policyHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "timestamp",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "submitter",
            "type": "address",
            "internalType": "address"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getDecisionKey",
    "inputs": [
      {
        "name": "subjectHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "context",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "policyHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "restricted",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setAuthorizedSubmitter",
    "inputs": [
      {
        "name": "submitter",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "allowed",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setRestricted",
    "inputs": [
      {
        "name": "value",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setVerifier",
    "inputs": [
      {
        "name": "verifierAddress",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "submitDecision",
    "inputs": [
      {
        "name": "subjectHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "context",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "decision",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "policyHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "a",
        "type": "uint256[2]",
        "internalType": "uint256[2]"
      },
      {
        "name": "b",
        "type": "uint256[2][2]",
        "internalType": "uint256[2][2]"
      },
      {
        "name": "c",
        "type": "uint256[2]",
        "internalType": "uint256[2]"
      },
      {
        "name": "publicSignals",
        "type": "uint256[3]",
        "internalType": "uint256[3]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "verifier",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IVerifier"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "DecisionSubmitted",
    "inputs": [
      {
        "name": "subjectHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "context",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "decision",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "policyHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "timestamp",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  }
] as const;
export type DecisionRegistryAbi = typeof DECISION_REGISTRY_ABI;

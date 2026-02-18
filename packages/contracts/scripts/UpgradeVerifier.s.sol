// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { Groth16Verifier } from "../contracts/Verifier.sol";
import { DecisionRegistry } from "../contracts/DecisionRegistry.sol";

contract UpgradeVerifier is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address newOwner = 0x168D8b4f50BB3aA67D05a6937B643004257118ED;

        vm.startBroadcast(deployerKey);

        // Step 1: Deploy new Verifier with updated verification key
        Groth16Verifier verifier = new Groth16Verifier();
        console2.log("Verifier deployed:", address(verifier));

        // Step 2: Deploy new DecisionRegistry pointing to new Verifier
        DecisionRegistry registry = new DecisionRegistry(address(verifier));
        console2.log("DecisionRegistry deployed:", address(registry));

        // Step 3: Transfer ownership to the target wallet
        registry.transferOwnership(newOwner);
        console2.log("Ownership transferred to:", newOwner);

        vm.stopBroadcast();

        // Verify
        console2.log("Registry owner now:", registry.owner());
        console2.log("Registry verifier:", address(registry.verifier()));
    }
}

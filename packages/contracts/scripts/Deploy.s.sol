// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { Groth16Verifier } from "../contracts/Verifier.sol";
import { DecisionRegistry } from "../contracts/DecisionRegistry.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        Groth16Verifier verifier = new Groth16Verifier();
        DecisionRegistry registry = new DecisionRegistry(address(verifier));

        vm.stopBroadcast();

        console2.log("Verifier:", address(verifier));
        console2.log("DecisionRegistry:", address(registry));
    }
}

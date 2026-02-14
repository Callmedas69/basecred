// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { console2 } from "forge-std/console2.sol";

import { DecisionRegistry } from "../contracts/DecisionRegistry.sol";

contract DeployRegistry is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address verifierAddress = vm.envAddress("VERIFIER_ADDRESS");

        vm.startBroadcast(deployerKey);

        DecisionRegistry registry = new DecisionRegistry(verifierAddress);

        vm.stopBroadcast();

        console2.log("Verifier (existing):", verifierAddress);
        console2.log("DecisionRegistry:", address(registry));
    }
}

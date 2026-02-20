// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// DEPRECATED: Use UpgradeRegistry.s.sol for upgrades, DeployProxy.s.sol for fresh deploy.
// This script is kept for reference only.

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Groth16Verifier} from "../contracts/Verifier.sol";
import {DecisionRegistry} from "../contracts/DecisionRegistry.sol";

contract UpgradeVerifier is Script {
    function run() external {
        uint256 ownerKey = vm.envUint("OWNER_PRIVATE_KEY");
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");

        vm.startBroadcast(ownerKey);

        // 1. Deploy new Verifier with updated verification key
        Groth16Verifier verifier = new Groth16Verifier();
        console2.log("Verifier deployed:", address(verifier));

        // 2. Update the verifier on the existing proxy
        DecisionRegistry registry = DecisionRegistry(proxyAddress);
        registry.setVerifier(address(verifier));
        console2.log("Verifier updated on registry:", proxyAddress);

        vm.stopBroadcast();

        // Verify
        console2.log("Registry owner:", registry.owner());
        console2.log("Registry verifier:", address(registry.verifier()));
    }
}

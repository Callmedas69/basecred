// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// DEPRECATED: Use DeployProxy.s.sol instead.
// This script is kept for reference only.

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {DecisionRegistry} from "../contracts/DecisionRegistry.sol";

contract DeployRegistry is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address verifierAddress = vm.envAddress("VERIFIER_ADDRESS");

        vm.startBroadcast(deployerKey);

        DecisionRegistry implementation = new DecisionRegistry();
        bytes memory initData = abi.encodeCall(
            DecisionRegistry.initialize,
            (verifierAddress, msg.sender)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        DecisionRegistry registry = DecisionRegistry(address(proxy));

        vm.stopBroadcast();

        console2.log("Verifier (existing):", verifierAddress);
        console2.log("DecisionRegistry (proxy):", address(registry));
    }
}

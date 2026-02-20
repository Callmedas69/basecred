// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {DecisionRegistry} from "../contracts/DecisionRegistry.sol";

contract UpgradeRegistry is Script {
    function run() external {
        uint256 ownerKey = vm.envUint("OWNER_PRIVATE_KEY");
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");

        vm.startBroadcast(ownerKey);

        // 1. Deploy new implementation
        DecisionRegistry newImplementation = new DecisionRegistry();
        console2.log("New implementation:", address(newImplementation));

        // 2. Upgrade proxy to new implementation (no re-initialization)
        DecisionRegistry proxy = DecisionRegistry(proxyAddress);
        proxy.upgradeToAndCall(address(newImplementation), "");
        console2.log("Proxy upgraded:", proxyAddress);

        vm.stopBroadcast();

        // Verify state preserved
        console2.log("Owner:", proxy.owner());
        console2.log("Verifier:", address(proxy.verifier()));
    }
}

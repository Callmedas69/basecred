// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Groth16Verifier} from "../contracts/Verifier.sol";
import {DecisionRegistry} from "../contracts/DecisionRegistry.sol";

contract DeployProxy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address registryOwner = vm.envAddress("REGISTRY_OWNER");

        vm.startBroadcast(deployerKey);

        // 1. Deploy stateless Verifier (not upgradeable)
        Groth16Verifier verifier = new Groth16Verifier();
        console2.log("Verifier:", address(verifier));

        // 2. Deploy DecisionRegistry implementation
        DecisionRegistry implementation = new DecisionRegistry();
        console2.log("Implementation:", address(implementation));

        // 3. Deploy ERC1967Proxy with initialize call
        bytes memory initData = abi.encodeCall(
            DecisionRegistry.initialize,
            (address(verifier), registryOwner)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        console2.log("Proxy (DecisionRegistry):", address(proxy));

        vm.stopBroadcast();

        // Verify via proxy
        DecisionRegistry registry = DecisionRegistry(address(proxy));
        console2.log("Owner:", registry.owner());
        console2.log("Verifier:", address(registry.verifier()));
    }
}

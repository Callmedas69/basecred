// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {DecisionRegistry} from "../contracts/DecisionRegistry.sol";

contract DeployProxy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address registryOwner = vm.envAddress("REGISTRY_OWNER");
        address verifierAddress = vm.envAddress("VERIFIER_ADDRESS");

        vm.startBroadcast(deployerKey);

        // 1. Deploy DecisionRegistry implementation
        DecisionRegistry implementation = new DecisionRegistry();
        console2.log("Implementation:", address(implementation));

        // 2. Deploy ERC1967Proxy with initialize call
        bytes memory initData = abi.encodeCall(
            DecisionRegistry.initialize,
            (verifierAddress, registryOwner)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        console2.log("Proxy (DecisionRegistry):", address(proxy));

        // 3. Lock initializeV2 with empty seed data (fresh deploy, counters start at 0)
        DecisionRegistry registry = DecisionRegistry(address(proxy));
        bytes32[] memory emptySubjects = new bytes32[](0);
        bytes32[] memory emptyContextIds = new bytes32[](0);
        uint64[] memory emptyContextCounts = new uint64[](0);
        registry.initializeV2(
            emptySubjects,
            [uint64(0), uint64(0), uint64(0)],
            emptyContextIds,
            emptyContextCounts,
            0
        );
        console2.log("initializeV2 locked (fresh deploy, counters start at 0)");

        vm.stopBroadcast();

        // Verify via proxy
        console2.log("--- Verification ---");
        console2.log("Owner:", registry.owner());
        console2.log("Verifier:", address(registry.verifier()));
        DecisionRegistry.Stats memory s = registry.getStats();
        console2.log("totalDecisions:", s.totalDecisions);
        console2.log("uniqueSubjects:", s.uniqueSubjectCount);
    }
}

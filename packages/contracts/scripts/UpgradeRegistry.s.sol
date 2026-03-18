// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {DecisionRegistry} from "../contracts/DecisionRegistry.sol";

contract UpgradeRegistry is Script {
    function run() external {
        uint256 ownerKey = vm.envUint("OWNER_PRIVATE_KEY");
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");

        // ---------------------------------------------------------------
        // Seed data for initializeV2
        // Source: on-chain DecisionSubmitted events as of upgrade time.
        // Verify these values against /api/v1/stats before broadcasting!
        // ---------------------------------------------------------------

        uint64 totalDecisionCount = 13;

        // 3 unique subject hashes (extract from events before deployment)
        bytes32[] memory existingSubjects = new bytes32[](3);
        existingSubjects[0] = 0x8d1e827a5fa8577696a330d9fef6ce8866481e90aabbb2940a5cd3520bb66d9d;
        existingSubjects[1] = 0xa168167a4b320ada1743d7820e56a8ae0ad4f77e7a13ef57c2a75ad8cb7d8c2d;
        existingSubjects[2] = 0xd31c915a4e7344d737f23ebdc5138116f2ae316466748f7a1b4ddcd36afbacfc;

        // Outcome counts: DENY=5, ALLOW_WITH_LIMITS=0, ALLOW=8
        uint64[3] memory outcomeCounts = [uint64(5), uint64(0), uint64(8)];

        // Context IDs: 0=allowlist.general, 1=comment, 2=publish, 3=apply, 4=governance.vote
        bytes32[] memory contextIds = new bytes32[](5);
        contextIds[0] = bytes32(uint256(0));
        contextIds[1] = bytes32(uint256(1));
        contextIds[2] = bytes32(uint256(2));
        contextIds[3] = bytes32(uint256(3));
        contextIds[4] = bytes32(uint256(4));

        // Context counts (parallel to contextIds)
        uint64[] memory contextCounts = new uint64[](5);
        contextCounts[0] = 4; // allowlist.general
        contextCounts[1] = 3; // comment
        contextCounts[2] = 2; // publish
        contextCounts[3] = 2; // apply
        contextCounts[4] = 2; // governance.vote

        vm.startBroadcast(ownerKey);

        // 1. Deploy new implementation
        DecisionRegistry newImplementation = new DecisionRegistry();
        console2.log("New implementation:", address(newImplementation));

        // 2. Encode initializeV2 calldata for atomic upgrade + seed
        bytes memory initV2Data = abi.encodeCall(
            DecisionRegistry.initializeV2,
            (existingSubjects, outcomeCounts, contextIds, contextCounts, totalDecisionCount)
        );

        // 3. Upgrade proxy with re-initialization (atomic)
        DecisionRegistry proxy = DecisionRegistry(proxyAddress);
        proxy.upgradeToAndCall(address(newImplementation), initV2Data);
        console2.log("Proxy upgraded with V2 init:", proxyAddress);

        vm.stopBroadcast();

        // 4. Verify seeded state
        DecisionRegistry.Stats memory stats = proxy.getStats();
        console2.log("--- Stats Verification ---");
        console2.log("totalDecisions:", stats.totalDecisions);
        console2.log("uniqueSubjects:", stats.uniqueSubjectCount);
        console2.log("denyCount:", stats.denyCount);
        console2.log("allowWithLimitsCount:", stats.allowWithLimitsCount);
        console2.log("allowCount:", stats.allowCount);

        for (uint256 i = 0; i < contextIds.length; i++) {
            console2.log("context", i, "count:", proxy.getContextDecisionCount(contextIds[i]));
        }

        console2.log("--- State Preserved ---");
        console2.log("Owner:", proxy.owner());
        console2.log("Verifier:", address(proxy.verifier()));
    }
}

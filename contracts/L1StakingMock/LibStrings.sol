// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title LibStrings
/// @custom:security-contact security@taiko.xyz
library LibStrings {
    bytes32 internal constant B_AUTOMATA_DCAP_ATTESTATION = bytes32("automata_dcap_attestation");
    bytes32 internal constant B_BLOCK_PROPOSER = bytes32("block_proposer");
    bytes32 internal constant B_BRIDGE = bytes32("bridge");
    bytes32 internal constant B_BRIDGE_WATCHDOG = bytes32("bridge_watchdog");
    bytes32 internal constant B_BRIDGED_ERC1155 = bytes32("bridged_erc1155");
    bytes32 internal constant B_BRIDGED_ERC20 = bytes32("bridged_erc20");
    bytes32 internal constant B_BRIDGED_ERC721 = bytes32("bridged_erc721");
    bytes32 internal constant B_CHAIN_WATCHDOG = bytes32("chain_watchdog");
    bytes32 internal constant B_ERC1155_VAULT = bytes32("erc1155_vault");
    bytes32 internal constant B_ERC20_VAULT = bytes32("erc20_vault");
    bytes32 internal constant B_ERC721_VAULT = bytes32("erc721_vault");
    bytes32 internal constant B_PROVER_ASSIGNMENT = bytes32("PROVER_ASSIGNMENT");
    bytes32 internal constant B_PROVER_SET = bytes32("prover_set");
    bytes32 internal constant B_QUOTA_MANAGER = bytes32("quota_manager");
    bytes32 internal constant B_SGX_WATCHDOG = bytes32("sgx_watchdog");
    bytes32 internal constant B_SIGNAL_SERVICE = bytes32("signal_service");
    bytes32 internal constant B_SP1_REMOTE_VERIFIER = bytes32("sp1_remote_verifier");
    bytes32 internal constant B_TAIKO = bytes32("taiko");
    bytes32 internal constant B_TAIKO_TOKEN = bytes32("taiko_token");
    bytes32 internal constant B_TIER_GUARDIAN = bytes32("tier_guardian");
    bytes32 internal constant B_TIER_GUARDIAN_MINORITY = bytes32("tier_guardian_minority");
    bytes32 internal constant B_TIER_ROUTER = bytes32("tier_router");
    bytes32 internal constant B_TIER_SGX = bytes32("tier_sgx");
    bytes32 internal constant B_TIER_TDX = bytes32("tier_tdx");
    bytes32 internal constant B_TIER_TEE_ANY = bytes32("tier_tee_any");
    bytes32 internal constant B_TIER_ZKVM_RISC0 = bytes32("tier_zkvm_risc0");
    bytes32 internal constant B_TIER_ZKVM_SP1 = bytes32("tier_zkvm_sp1");
    bytes32 internal constant B_TIER_ZKVM_ANY = bytes32("tier_zkvm_any");
    bytes32 internal constant B_TIER_ZKVM_AND_TEE = bytes32("tier_zkvm_and_tee");
    bytes32 internal constant B_RISCZERO_GROTH16_VERIFIER = bytes32("risc0_groth16_verifier");
    bytes32 internal constant B_WITHDRAWER = bytes32("withdrawer");
    bytes32 internal constant H_RETURN_LIVENESS_BOND = keccak256("RETURN_LIVENESS_BOND");
    bytes32 internal constant H_SIGNAL_ROOT = keccak256("SIGNAL_ROOT");
    bytes32 internal constant H_STATE_ROOT = keccak256("STATE_ROOT");

    //CHANGE(MOONCHAIN): Added to support Moonchain
    bytes32 internal constant B_ETHMXC_PRICE_AGGREGATOR = bytes32("ethmxc_price_aggregator");
    bytes32 internal constant B_STAKING = bytes32("staking");
    bytes32 internal constant B_ZKCENTER = bytes32("zkcenter");
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol";

/// @title ISO Contract interfaces
interface ISgxMinerToken is IERC721EnumerableUpgradeable {
    // Reverts
    error ALREADY_MINTED();
    error NOT_MINTED();

    /// @dev This event gets emitted when a NFT minted
    event Minted(uint256 sgxInstanceId, address tokenOwner);

    /// @dev This event gets emitted when a NFT burned
    event Burned(uint256 sgxInstanceId);

    /// @notice Return the name of contract
    function name2() external view returns (string memory);

    /// @notice Mint a NFT
    /// @param _sgxInstanceId The SGX Instance ID of the miner (Instance ID = token ID)
    function mint(uint256 _sgxInstanceId) external;

    /// @notice Check Sensor NFT minted or not
    /// @param _sgxInstanceId The SGX Instance ID of the miner
    function isMinted(uint256 _sgxInstanceId) external view returns (bool);

    /// @notice Burn a Sensor NFT (onlyOwner)
    /// @param _sgxInstanceId The SGX Instance ID of the miner
    function burn(uint256 _sgxInstanceId) external;
}

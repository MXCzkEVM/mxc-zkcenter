// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721EnumerableUpgradeable.sol";

/// @title ISO Contract interfaces
interface IMiningGroupToken is IERC721EnumerableUpgradeable {
    // Reverts
    error ALREADY_MINTED();
    error NOT_MINTED();


    /// @dev This event gets emitted when a NFT minted
    event Minted(uint256 tokenId, address tokenOwner);

    /// @dev This event gets emitted when a NFT burned
    event Burned(uint256 tokenId, address tokenOwner);

    /// @notice Return the name of contract
    function name2() external view returns (string memory);

    /// @notice Mint a NFT (onlyZkCenter)
    /// @param tokenOwner Owner of the minted token
    function mint(address tokenOwner) external;

    /// @notice Get token id owned
    /// @param tokenOwner Owner of the minted token
    function ownedTokenId(address tokenOwner) external view returns (uint256);

    /// @notice Check Sensor NFT minted or not
    /// @param tokenId The SGX Instance ID of the miner
    function isMinted(uint256 tokenId) external view returns (bool);

    /// @notice Burn a Sensor NFT (onlyZkCenter)
    /// @param tokenId The SGX Instance ID of the miner
    function burn(uint256 tokenId) external;
}

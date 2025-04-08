// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "./IMxcTokenMock.sol";
import "./MxcTokenStorage.sol";

/**
 * @title MxcToken Mock (for testing)
 * @author Ian
 */
contract MxcTokenMock is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    ERC20Upgradeable,
    IMxcTokenMock,
    MxcTokenStorage
{
    /// @notice Contract initialization
    function __MxcTokenMock_init(address _owner) internal onlyInitializing {
        // Mint 1 billion tokens
        _mint(_owner, 1_000_000_000 ether);
    }

    /// @notice Called when deployed
    function initialize() external initializer {
        console.log("MxcTokenMock initialized. Owner ", _msgSender());
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __ERC20_init("MXC Token", "MXC");
        __MxcTokenMock_init(_msgSender());
        __Ownable_init_unchained();
    }

    /// @notice UUPSUpgradeable access control mechanism
    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyOwner {
        console.log("MxcTokenMock implementation address:", newImplementation);
    }

    /// @notice Return the name of contract
    function name2() external view virtual returns (string memory) {
        return "MxcTokenMock-v0";
    }

    function mint(address to, uint256 amount) external {
    }

    function burn(address from, uint256 amount) external {
    }
}
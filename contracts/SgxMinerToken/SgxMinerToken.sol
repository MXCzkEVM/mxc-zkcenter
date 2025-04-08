// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./ISgxMinerToken.sol";
import "./AccessControl.sol";
import "./Storage1.sol";

/**
 * @title SGX Miner ERC721 NFT
 * @author Ian
 */
contract SgxMinerToken is
    Initializable,
    UUPSUpgradeable,
    ERC721EnumerableUpgradeable,
    ReentrancyGuardUpgradeable,
    AccessControl,
    ISgxMinerToken,
    Storage1
{
    /// @notice Contract initialization
    function __SgxMinerToken_init() internal onlyInitializing {}

    /// @notice Called when deployed
    function initialize(
        string memory name_,
        string memory symbol_
    ) external initializer {
        console.log("SgxMinerToken initialized. Owner ", _msgSender());
        __ERC721_init(name_, symbol_);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __SgxMinerToken_init();
        __Ownable_init_unchained();
    }

    /// @notice UUPSUpgradeable access control mechanism
    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyOwner {
        console.log("SgxMinerToken implementation address:", newImplementation);
    }

    /// @notice Return the name of contract
    function name2() external view virtual returns (string memory) {
        return "SgxMinerToken-v0";
    }

    /// @notice Mint a NFT
    function mint(uint256 _sgxInstanceId) external nonReentrant onlyZkCenter {
        if (_exists(_sgxInstanceId)) {
            revert ALREADY_MINTED();
        }
        _safeMint(_msgSender(), _sgxInstanceId);
        emit Minted(_sgxInstanceId);
    }

    /// @notice Check Sensor NFT minted or not
    function isMinted(uint256 _sgxInstanceId) external view returns (bool) {
        return _exists(_sgxInstanceId);
    }

    /// @notice Burn a Sensor NFT (onlyOwner)
    function burn(uint256 _sgxInstanceId) external nonReentrant onlyZkCenter {
        _requireMinted(_sgxInstanceId);
        _burn(_sgxInstanceId);
        emit Burned(_sgxInstanceId);
    }
}

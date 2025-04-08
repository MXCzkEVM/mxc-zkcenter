// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./IMiningGroupToken.sol";
import "./AccessControl.sol";
import "./Storage1.sol";

/**
 * @title Mining Group ERC721 NFT
 * @author Ian
 */
contract MiningGroupToken is
    Initializable,
    UUPSUpgradeable,
    ERC721EnumerableUpgradeable,
    ReentrancyGuardUpgradeable,
    AccessControl,
    IMiningGroupToken,
    Storage1
{
    using Counters for Counters.Counter;

    /// @notice Contract initialization
    function __MiningGroupToken_init() internal onlyInitializing {}

    /// @notice Called when deployed
    function initialize(
        string memory name_,
        string memory symbol_
    ) external initializer {
        console.log("MiningGroupToken initialized. Owner ", _msgSender());
        __ERC721_init(name_, symbol_);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __MiningGroupToken_init();
        __Ownable_init_unchained();
    }

    /// @notice UUPSUpgradeable access control mechanism
    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyOwner {
        console.log(
            "MiningGroupToken implementation address:",
            newImplementation
        );
    }

    /// @notice Return the name of contract
    function name2() external view virtual returns (string memory) {
        return "MiningGroupToken-v0";
    }

    /// @notice Mint a NFT (onlyZkCenter)
    function mint(address tokenOwner) external nonReentrant onlyZkCenter {
        uint256 _token_id = Counters.current(_tokenCount);
        if (_token_id == 0) {
            // Give up token id 0
            _tokenCount.increment();
            _token_id = _tokenCount.current();
        }

        if (_ownerList[tokenOwner] != 0) {
            // Only allow one NFT per owner
            revert ALREADY_MINTED();
        }

        _tokenList[_token_id] = tokenOwner;
        _ownerList[tokenOwner] = _token_id;

        _tokenCount.increment();
        _safeMint(tokenOwner, _token_id);
        emit Minted(_token_id, tokenOwner);
    }

    /// @notice Get token id owned
    function ownedTokenId(address tokenOwner) external view returns (uint256) {
        return _ownerList[tokenOwner];
    }

    /// @notice Check NFT minted or not
    function isMinted(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    /// @notice Burn a NFT (onlyZkCenter)
    function burn(uint256 tokenId) external nonReentrant onlyZkCenter {
        if (!_exists(tokenId)) {
            revert NOT_MINTED();
        }

        address _tokenOwner = _tokenList[tokenId];
        _tokenList[tokenId] = address(0);
        _ownerList[_tokenOwner] = 0;

        _burn(tokenId);
        emit Burned(tokenId, _tokenOwner);
    }
}

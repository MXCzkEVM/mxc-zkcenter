// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Counters.sol";

import "./ISgxMinerToken.sol";

contract Storage1 {
    using Counters for Counters.Counter;

    /// @notice Number of Token
    Counters.Counter internal _tokenCount;
    
    // Gap
    uint256[50] private __gap;
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Counters.sol";

import "./IMiningGroupToken.sol";

contract Storage1 {
    using Counters for Counters.Counter;

    /// @notice Number of Token
    Counters.Counter internal _tokenCount;

    //
    mapping(uint256 => address) internal _tokenList;
    mapping(address => uint256) internal _ownerList;

    // Gap
    uint256[50] private __gap;
}
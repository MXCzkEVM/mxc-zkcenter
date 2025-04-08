// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Counters.sol";

import "../SgxMinerToken/ISgxMinerToken.sol";
import "../MiningGroupToken/IMiningGroupToken.sol";
import "../mxc-mono/IL1Staking.sol";
import "../mxc-mono/IMxcToken.sol";

import "./IZkCenter.sol";

contract Storage1 {
    using Counters for Counters.Counter;

    // Internal variables
    mapping(uint256 => address) internal _minerRegistration;
    mapping(address => uint256) internal _stakeToGroupList;
    mapping(uint256 => address[]) internal _groupMemberList;
    mapping(uint256 => mapping(address => uint256))
        internal _groupMemberListIndex;
    mapping(address => uint256) internal _commissionPool;

    // Public variables
    ISgxMinerToken public sgxMinerToken;
    IMiningGroupToken public miningGroupToken;
    IL1Staking public l1Staking;
    IMxcToken public mxcToken;

    uint256 public adminFee; // in 0.01%, a value of 100 means 1%
    uint256 public commissionRate; // in 0.01%, a value of 1800 means 18%

    // Gap
    uint256[50] private __gap;
}

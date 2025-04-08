// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../common/ControllableAndOwnable.sol";

contract AccessControl is ControllableAndOwnable {
    address internal ZkCenter;

    error ACCESSCONTROL_DENIED();

    /// @notice Only ZkCenter
    modifier onlyZkCenter() {
        if (msg.sender != ZkCenter) {
            revert ACCESSCONTROL_DENIED();
        }
        _;
    }

    /// @notice Set ZkCenter
    function setZkCenter(address _zkcenter) public onlyOwner {
        if (_zkcenter == address(0)) {
            ZkCenter = owner();
        } else {
            ZkCenter = _zkcenter;
        }
    }

    /// @notice Init
    function __AccessControl_init() public onlyInitializing {
        ZkCenter = msg.sender;
        __ControllableAndOwnable_init();
    }
}

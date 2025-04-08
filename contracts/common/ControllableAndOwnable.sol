// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract ControllableAndOwnable is OwnableUpgradeable{
    mapping(address => bool) internal controllers;

    error CONTROLLABLE_ACCESS_DENIED();

    event ControllerChanged(address indexed controller, bool enabled);

    /// @notice Only allow controller
    modifier onlyController() {
        if (!controllers[_msgSender()]) {
           revert  CONTROLLABLE_ACCESS_DENIED();
        }
        _;
    }

    /// @notice Init
    function __ControllableAndOwnable_init() public onlyInitializing {
        controllers[_msgSender()] = true;
        __Ownable_init();
    }

    /// @notice Set controller
    function setController(address controller, bool enabled) public onlyOwner {
        controllers[controller] = enabled;
        emit ControllerChanged(controller, enabled);
    }

    /// @notice Check sender is controller or not
    function isController() view external returns (bool) {
        return controllers[_msgSender()];
    }

}

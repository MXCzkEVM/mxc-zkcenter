// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IMxcTokenMock is IERC20Upgradeable {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

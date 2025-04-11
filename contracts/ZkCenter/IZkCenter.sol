// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ISO Contract interfaces
interface IZkCenter {
    // Reverts
    error ZKCENTER_ACCESS_DENIED();
    error ZKCENTER_VALUE_TOO_HIGH();
    error MINER_NOT_REGISTERED();
    error GROUP_NOT_EXIST();
    error GROUP_WITH_STAKING();
    error GROUP_WITH_REWARD();
    error GROUP_WITH_MEMBERS();
    error STAKE_GROUP_NOT_FOUND();
    error STAKE_GROUP_LEADER();
    error STAKE_ALREADY_IN_GROUP();
    error STAKE_NO_REWARD();
    error STAKE_NOT_IN_GROUP();
    error STAKE_NO_COMMISIION();

    /// @dev This event gets emitted when a miner registered
    event MinerRegistered(uint256 sgxInstanceId, address to);

    /// @dev This event gets emitted when a group leader claim the commission
    event CommissionClaimed(uint256 groupId, address to, uint256 amount);

    //========================================================================
    //========================================================================
    /// @notice Return the name of contract
    function name2() external view returns (string memory);

    /// @notice Set Administration Fee and Commission Rate
    /// @param admin Admin fee in 0.01%
    /// @param commission rate in 0.01%
    function setFee(uint256 admin, uint256 commission) external;

    /// @notice Set Recipient for Administration Fee
    /// @param recipient The Recipient
    function setAdminFeeRecipient(address recipient) external;

    /// @notice Set max reward amount ratio
    /// @param ratio The max claim ratio
    function setMaxRewardRatio(uint256 ratio) external;

    //========================================================================
    //========================================================================
    /// @notice Mint a Miner NFT
    /// @param sgxInstanceId The SGX Instance ID of the miner
    function minerMint(uint256 sgxInstanceId) external;

    /// @notice Register a miner with wallet address
    /// @param sgxInstanceId The SGX Instance ID of the miner
    function minerRegister(uint256 sgxInstanceId, address _to) external;

    /// @notice Claim a miner
    /// @param sgxInstanceId The SGX Instance ID of the miner
    function minerClaim(uint256 sgxInstanceId) external;

    /// @notice Claim a miner owned by other
    /// @param sgxInstanceId The SGX Instance ID of the miner
    /// @param from Previous miner owner
    function minerClaim2(uint256 sgxInstanceId, address from) external;

    /// @notice Get miner owner
    /// @param sgxInstanceId The SGX Instance ID of the miner
    function minerGetOwner(
        uint256 sgxInstanceId
    ) external view returns (address);

    //========================================================================
    //========================================================================
    /// @notice Create a mining group
    function miningGroupCreate() external;

    /// @notice Get group token id
    function miningGroupGetId() external view returns (uint256);

    /// @notice Total Number of groups (indexed)
    function miningGroupGetTotal() external view returns (uint256);

    /// @notice Get Group ID by index
    /// @param index Index of the group, combining with miningGroupGetTotal() could loop through all group.
    function miningGroupGetIdByIndex(
        uint256 index
    ) external view returns (uint256);

    /// @notice Leader of a group
    /// @param groupId Group ID
    function miningGroupGetLeader(
        uint256 groupId
    ) external view returns (address);

    /// @notice Number of members of a group
    /// @param groupId Group ID
    function miningGroupGetMemberCount(
        uint256 groupId
    ) external view returns (uint256);

    /// @notice Get member by index
    /// @param groupId Group ID
    /// @param index Index of the member, combining with miningGroupGetMemberCount() could loop through all member.
    function miningGroupGetMemberByIndex(
        uint256 groupId,
        uint256 index
    ) external view returns (address);

    //========================================================================
    //========================================================================
    /// @notice Deposit MXC token for staking
    /// @param amount The amount of token to deposit.
    function stakeDeposit(uint256 amount) external;

    /// @notice Deposit MXC token for staking (Join a Group)
    /// @param groupId The token id of the group
    /// @param amount The amount of token to deposit.
    function stakeToGroup(uint256 groupId, uint256 amount) external;

    /// @notice Get staking status
    function stakeGetStatus()
        external
        view
        returns (
            uint256 stakingGroup,
            uint256 stakedAmount,
            uint256 lastClaimedEpoch,
            uint256 withdrawalRequestEpoch
        );

    /// @notice Get gross rewarding amount
    function stakeGetGrossReward() external view returns (uint256);

    /// @notice Claim staking reward
    function stakeClaimReward() external;

    /// @notice Get amount of commission
    function stakeGetCommission() external view returns (uint256);

    /// @notice Claim staking commission
    function stakeClaimCommission() external;

    /// @notice Request withdraw from staking
    /// @param cancel True to cancel previous withdraw
    function stakeRequestWithdraw(bool cancel) external;

    /// @notice Perform withdraw from staking
    function stakeWithdraw() external;
}

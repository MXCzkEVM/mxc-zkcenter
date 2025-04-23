// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import "../SgxMinerToken/ISgxMinerToken.sol";
import "../MiningGroupToken/IMiningGroupToken.sol";
import "../common/ControllableAndOwnable.sol";

import "./IZkCenter.sol";
import "./Storage1.sol";

/**
 * @title SGX ERC721 NFT
 * @author Ian
 */
contract ZkCenter is
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    ControllableAndOwnable,
    IERC721Receiver,
    IZkCenter,
    Storage1
{
    using Counters for Counters.Counter;

    /// @notice Contract initialization
    function __ZkCenter_init(
        address _sgxMinerToken,
        address _miningGroupToken,
        address _L1Staking,
        address _MxcToken
    ) internal onlyInitializing {
        sgxMinerToken = ISgxMinerToken(_sgxMinerToken);
        miningGroupToken = IMiningGroupToken(_miningGroupToken);
        l1Staking = IL1Staking(_L1Staking);
        mxcToken = IMxcToken(_MxcToken);
        // Default
        adminFee = 200; // 2% Admin Fee
        commissionRate = 1900; // 19% Commission
        maxRewardRatio = 0; // Disabled
        adminFeeRecipient = _msgSender();
    }

    /// @notice Called when deployed
    function initialize(
        address _sgxMinerToken,
        address _miningGroupToken,
        address _L1Staking,
        address _MxcToken
    ) external initializer {
        console.log("ZkCenter initialized. Owner ", _msgSender());
        __ControllableAndOwnable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __ZkCenter_init(
            _sgxMinerToken,
            _miningGroupToken,
            _L1Staking,
            _MxcToken
        );
        __Ownable_init_unchained();
    }

    /// @notice UUPSUpgradeable access control mechanism
    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyOwner {
        console.log("ZkCenter implementation address:", newImplementation);
    }

    /// @notice Support safeTransfers from ERC721
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external view virtual returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    //========================================================================
    //========================================================================
    /// @notice Return the name of contract
    function name2() external view virtual returns (string memory) {
        return "ZkCenter-v0";
    }

    /// @notice Set Administration Fee and Commission Rate
    function setFee(uint256 admin, uint256 commission) external onlyController {
        uint256 total = admin + commission;
        // Max limited to 90% both
        if (total > 9000) {
            revert ZKCENTER_VALUE_TOO_HIGH();
        }
        adminFee = admin;
        commissionRate = commission;
    }

    /// @notice Set Recipient for Administration Fee
    function setAdminFeeRecipient(address recipient) external onlyController{
        adminFeeRecipient = recipient;
    }

    /// @notice Set max reward amount ratio
    /// @param ratio The max claim ratio
    function setMaxRewardRatio(uint256 ratio) external onlyController{
        maxRewardRatio = ratio;
    }

    //========================================================================
    //========================================================================
    /// @notice Register a miner with wallet address
    function minerRegister(
        uint256 sgxInstanceId,
        address to
    ) external nonReentrant onlyController {
        _minerRegistration[sgxInstanceId] = to;
        emit MinerRegistered(sgxInstanceId, to);
    }

    /// @notice Mint a Miner NFT
    function minerMint(uint256 sgxInstanceId) external nonReentrant {
        sgxMinerToken.mint(sgxInstanceId);
    }

    /// @notice Burn a Miner NFT
    function minerBurn(uint256 sgxInstanceId) external nonReentrant onlyController{
        sgxMinerToken.burn(sgxInstanceId);
    }

    /// @notice Claim a miner
    function minerClaim(uint256 sgxInstanceId) external nonReentrant {
        if (_minerRegistration[sgxInstanceId] != _msgSender()) {
            revert MINER_NOT_REGISTERED();
        }
        sgxMinerToken.safeTransferFrom(
            address(this),
            _msgSender(),
            sgxInstanceId
        );
    }

    /// @notice Claim a miner owned by other
    function minerClaim2(
        uint256 sgxInstanceId,
        address from
    ) external nonReentrant {
        if (_minerRegistration[sgxInstanceId] != _msgSender()) {
            revert MINER_NOT_REGISTERED();
        }
        sgxMinerToken.safeTransferFrom(from, _msgSender(), sgxInstanceId);
    }

    /// @notice Get miner owner
    function minerGetOwner(
        uint256 sgxInstanceId
    ) external view returns (address) {
        return sgxMinerToken.ownerOf(sgxInstanceId);
    }

    //========================================================================
    //========================================================================
    /// @notice Create a mining group
    function miningGroupCreate() external nonReentrant {
        miningGroupToken.mint(_msgSender());
    }

    /// @notice Delete a mining group
    function miningGroupDelete() external nonReentrant {
        // Check group ownership and existance.
        uint256 _group_id = miningGroupToken.ownedTokenId(_msgSender());
        if (_group_id == 0) {
            revert GROUP_NOT_EXIST();
        }
        if (!miningGroupToken.isMinted(_group_id)) {
            revert GROUP_NOT_EXIST();
        }

        // Must no reward wait for claim
        uint256 _gross_reward = l1Staking.stakingCalculateRewardDebt(
            _msgSender()
        );
        if (_gross_reward != 0) {
            revert GROUP_WITH_REWARD();
        }

        // Must without staking
        (uint256 _amount, , ) = l1Staking.stakingUserState(_msgSender());
        if (_amount != 0) {
            revert GROUP_WITH_STAKING();
        }

        // Must no other staking to this group
        uint256 _member_count = _groupMemberList[_group_id].length;
        if (_member_count != 0) {
            revert GROUP_WITH_MEMBERS();
        }

        // Burn the NFT
        miningGroupToken.burn(_group_id);
    }

    /// @notice Get group token id
    function miningGroupGetId() external view returns (uint256) {
        uint256 _group_id = miningGroupToken.ownedTokenId(_msgSender());
        if (_group_id == 0) {
            revert GROUP_NOT_EXIST();
        }
        if (!miningGroupToken.isMinted(_group_id)) {
            revert GROUP_NOT_EXIST();
        }

        return _group_id;
    }

    /// @notice Total Number of groups
    function miningGroupGetTotal() external view returns (uint256) {
        return miningGroupToken.totalSupply();
    }

    /// @notice Get Group ID by index
    function miningGroupGetIdByIndex(
        uint256 index
    ) external view returns (uint256) {
        return miningGroupToken.tokenByIndex(index);
    }

    /// @notice Leader of a group
    function miningGroupGetLeader(
        uint256 groupId
    ) external view returns (address) {
        return miningGroupToken.ownerOf(groupId);
    }

    /// @notice Number of members of a group
    function miningGroupGetMemberCount(
        uint256 groupId
    ) external view returns (uint256) {
        return _groupMemberList[groupId].length;
    }

    /// @notice Get member by index
    function miningGroupGetMemberByIndex(
        uint256 groupId,
        uint256 index
    ) external view returns (address) {
        return _groupMemberList[groupId][index];
    }

    //========================================================================
    //========================================================================
    /// @notice Deposit MXC token for staking
    function stakeDeposit(uint256 amount) external nonReentrant {
        uint256 _group_token_id = miningGroupToken.ownedTokenId(_msgSender());
        uint256 _sender_gid = _stakeToGroupList[_msgSender()];

        if (_group_token_id == 0) {
            revert STAKE_GROUP_NOT_FOUND();
        }
        if (!miningGroupToken.isMinted(_group_token_id)) {
            revert GROUP_NOT_EXIST();
        }
        if ((_sender_gid != 0) && (_sender_gid != _group_token_id)) {
            revert STAKE_ALREADY_IN_GROUP();
        }

        _stakeToGroupList[_msgSender()] = _group_token_id;
        l1Staking.stake(_msgSender(), amount);
    }

    /// @notice Deposit MXC token for staking (Join a Group)
    function stakeToGroup(
        uint256 groupId,
        uint256 amount
    ) external nonReentrant {
        uint256 _group_token_id = miningGroupToken.ownedTokenId(_msgSender());
        uint256 _sender_gid = _stakeToGroupList[_msgSender()];

        if (_group_token_id != 0) {
            revert STAKE_GROUP_LEADER();
        }
        if (!miningGroupToken.isMinted(groupId)) {
            revert GROUP_NOT_EXIST();
        }
        if ((_sender_gid != 0) && (_sender_gid != groupId)) {
            revert STAKE_ALREADY_IN_GROUP();
        }

        if (_stakeToGroupList[_msgSender()] == 0) {
            // Not in a group yet
            _stakeToGroupList[_msgSender()] = groupId;
            _addMemberToGroupEnumeration(groupId, _msgSender());
        }

        l1Staking.stake(_msgSender(), amount);
    }

    /// @notice Get staking status
    function stakeGetStatus()
        external
        view
        returns (
            uint256 stakingGroup,
            uint256 stakedAmount,
            uint256 lastClaimedEpoch,
            uint256 withdrawalRequestEpoch
        )
    {
        uint256 _sender_gid = _stakeToGroupList[_msgSender()];
        (
            uint256 _amount,
            uint256 _last_claimed,
            uint256 _withdrawal_req
        ) = l1Staking.stakingUserState(_msgSender());

        return (_sender_gid, _amount, _last_claimed, _withdrawal_req);
    }

    /// @notice Get gross rewarding amount
    function stakeGetGrossReward() external view returns (uint256) {
        return l1Staking.stakingCalculateRewardDebt(_msgSender());
    }

    /// @notice Claim staking reward
    function stakeClaimReward() external nonReentrant {
        uint256 _group_token_id = miningGroupToken.ownedTokenId(_msgSender());
        uint256 _sender_gid = _stakeToGroupList[_msgSender()];

        // Claim amount to this contract first
        if (_sender_gid == 0) {
            revert STAKE_NOT_IN_GROUP();
        }

        uint256 _amount = l1Staking.stakingClaimReward(_msgSender());
        if (_amount == 0) return;

        if (_group_token_id == _sender_gid) {
            // Claim by group leader, reduce admin fee
            uint256 admin_fee = (_amount * adminFee) / 10000;
            _amount = _amount - admin_fee;
            mxcToken.transfer(_msgSender(), _amount);
            mxcToken.transfer(adminFeeRecipient, admin_fee);
        } else {
            address group_leader = miningGroupToken.ownerOf(_sender_gid);
            uint256 admin_fee = (_amount * adminFee) / 10000;
            uint256 commision = (_amount * commissionRate) / 10000;
            _amount = _amount - admin_fee - commision;
            _commissionPool[group_leader] += commision;
            mxcToken.transfer(_msgSender(), _amount);
            mxcToken.transfer(adminFeeRecipient, admin_fee);
        }
    }

    /// @notice Get amount of commission
    function stakeGetCommission() external view returns (uint256) {
        return _commissionPool[_msgSender()];
    }

    /// @notice Claim staking commission
    function stakeClaimCommission() external nonReentrant {
        uint256 _group_token_id = miningGroupToken.ownedTokenId(_msgSender());
        uint256 _amount = _commissionPool[_msgSender()];
        if (_amount == 0) {
            revert STAKE_NO_COMMISIION();
        }
        _commissionPool[_msgSender()] = 0;
        mxcToken.transfer(_msgSender(), _amount);

        emit CommissionClaimed(_group_token_id, _msgSender(), _amount);
    }

    /// @notice Request withdraw from staking
    /// @param cancel True to cancel previous withdraw
    function stakeRequestWithdraw(bool cancel) external nonReentrant {
        l1Staking.stakingRequestWithdrawal(_msgSender(), cancel);
    }

    /// @notice Perform withdraw from staking
    function stakeWithdraw() external nonReentrant {
        uint256 _group_token_id = miningGroupToken.ownedTokenId(_msgSender());
        uint256 _sender_gid = _stakeToGroupList[_msgSender()];

        if (_sender_gid == 0) {
            revert STAKE_NOT_IN_GROUP();
        }

        if (_group_token_id != _sender_gid) {
            // Group member withdraw
            _removeMemberFromGroupEnumeration(_sender_gid, _msgSender());
        }
        _stakeToGroupList[_msgSender()] = 0;
        l1Staking.stakingWithdrawal(_msgSender());
    }

    //========================================================================
    // Internal functions
    //========================================================================
    // @notice Add a member to a group.
    function _addMemberToGroupEnumeration(
        uint256 groupId,
        address member
    ) private {
        _groupMemberListIndex[groupId][member] = _groupMemberList[groupId]
            .length;
        _groupMemberList[groupId].push(member);
    }

    // @notice Remove a member from a group.
    // This has O(1) time complexity, but alters the order of the _groupMemberList array.
    function _removeMemberFromGroupEnumeration(
        uint256 groupId,
        address member
    ) private {
        // To prevent a gap in the items array, we store the last item in the index of the item to delete, and
        // then delete the last slot (swap and pop).

        uint256 _lastMemberIndex = _groupMemberList[groupId].length - 1;
        uint256 _targetmemberIndex = _groupMemberListIndex[groupId][member];

        // When the item to delete is the last item, the swap operation is unnecessary. However, since this occurs so
        // rarely (when the last minted item is burnt) that we still do the swap here to avoid the gas cost of adding
        // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
        address _lastMember = _groupMemberList[groupId][_lastMemberIndex];

        _groupMemberList[groupId][_targetmemberIndex] = _lastMember; // Move the last item to the slot of the to-delete item
        _groupMemberListIndex[groupId][_lastMember] = _targetmemberIndex; // Update the moved item's index

        // This also deletes the contents at the last position of the array
        delete _groupMemberListIndex[groupId][member];
        _groupMemberList[groupId].pop();
    }
}

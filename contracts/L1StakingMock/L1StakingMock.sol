// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "../../mxc-mono/IL1Staking.sol";
import "./IMxcTokenMock.sol";
import "./LibStrings.sol";

/**
 * @title L1Staking Mock (for testing)
 * @author Ian
 */
contract L1StakingMock is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    IL1Staking
{

    struct StakingState {
        mapping(address => uint256) stakingBalances;
        mapping(address => uint256) lastClaimedEpoch; // Track the last epoch when the user claimed rewards
        mapping(address => uint256) withdrawalRequestEpoch;
        uint256 totalBalance;
        uint256 totalReward;
        uint64 lastDepositRewardTime; // last deposit reward time
        uint64 rewardBeginEpoch;
        uint64 __reserved2;
        uint64 __reserved3;
        mapping(uint256 => uint256) epochReward;
        uint256[39] __gap;
    }

    /// @dev Emitted when user staking mxc token.
    event Staking(address indexed user, uint256 amount);

    /// @dev Emitted when deposit reward.
    event DepositReward(address indexed user, uint256 amount);

    /// @dev Emitted when user withdraw.
    event Withdrawal(address indexed user, uint256 amount);

    /// @dev Emitted when user claim reward.
    event ClaimReward(address indexed user, uint256 amount, uint256 lastClaimedEpoch);

    /// @dev Emitted when user slash.
    event Slash(address indexed user, uint256 amount);

    error INSUFFICIENT_DEPOSIT();
    error INSUFFICIENT_BALANCE();
    error WITHDRAWAL_LOCKED();
    error REWARD_ALREADY_CLAIMED();
    error REWARD_NOT_CLAIM();

    uint256 public constant MIN_DEPOSIT = 1_000_000 ether;
    uint256 public constant WITHDRAWAL_LOCK_EPOCH = 2;

    StakingState public stakingState;
    uint256[50] private __gap;

    uint256 public constant EPOCH_DURATION = 7 days; // 1 week in seconds

    // For mock
    IMxcTokenMock internal mxcTokenMock;
    uint256 _currentEpoch;
    modifier whenNotPaused() {
        _;
    }
    modifier onlyFromNamed(bytes32 _name) {
        _;
    }
    modifier onlyFromOptionalNamed(bytes32 _name) {
        _;
    }

    /// @notice Contract initialization
    function __L1StakingMock_init(address _MxcToken) internal onlyInitializing {
        mxcTokenMock = IMxcTokenMock(_MxcToken);
    }

    /// @notice Called when deployed
    function initialize(address _MxcToken) external initializer {
        console.log("L1StakingMock initialized. Owner ", _msgSender());
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __L1StakingMock_init(_MxcToken);
        __Ownable_init_unchained();
    }

    /// @notice UUPSUpgradeable access control mechanism
    function _authorizeUpgrade(
        address newImplementation
    ) internal virtual override onlyOwner {
        console.log("L1StakingMock implementation address:", newImplementation);
    }

    /// @notice Return the name of contract
    function name2() external view virtual returns (string memory) {
        return "L1StakingMock-v0";
    }

    /// @dev Deposits MXC token to be used as bonds.
    /// @param _user The user address to credit.
    /// @param _amount The amount of token to deposit.
    function stake(
        address _user,
        uint256 _amount
    )
    external
    whenNotPaused nonReentrant
    onlyFromOptionalNamed(LibStrings.B_ZKCENTER)
    {
        uint256 newBalance = stakingState.stakingBalances[_user] + _amount;
        if (newBalance < MIN_DEPOSIT) revert INSUFFICIENT_DEPOSIT();
        if (!_isClaimed(_user)) revert REWARD_NOT_CLAIM();
        _mxc().transferFrom(_user, address(this), _amount);
        stakingState.stakingBalances[_user] += _amount;
        stakingState.totalBalance += _amount;
        stakingState.lastClaimedEpoch[_user] = getCurrentEpoch() - 1;
        emit Staking(_user, _amount);
    }

    /// @dev Withdrawal request
    /// @param _user The user address who request the withdraw
    function stakingRequestWithdrawal(
        address _user,
        bool cancel
    )
    external nonReentrant
    onlyFromOptionalNamed(LibStrings.B_ZKCENTER)
    {
        if (stakingState.stakingBalances[_user] == 0) revert INSUFFICIENT_BALANCE();
        if (cancel) {
            stakingState.withdrawalRequestEpoch[_user] = 0; // Reset the time of the withdrawal
        } else {
            stakingState.withdrawalRequestEpoch[_user] = getCurrentEpoch();
        }
    }

    /// @dev User completes the withdrawal after the lock period
    /// @param _user The user address for the withdraw
    function stakingWithdrawal(address _user)
    external whenNotPaused nonReentrant
    onlyFromOptionalNamed(LibStrings.B_ZKCENTER)
    {
        uint256 amount = stakingState.stakingBalances[_user]; // Get the user's staked balance

        if (amount == 0) revert INSUFFICIENT_BALANCE();
        if (!_isClaimed(_user)) revert REWARD_NOT_CLAIM();

        if (
            stakingState.withdrawalRequestEpoch[_user] == 0
            || getCurrentEpoch() < stakingState.withdrawalRequestEpoch[_user] + WITHDRAWAL_LOCK_EPOCH
        ) {
            revert WITHDRAWAL_LOCKED();
        }

        // reset state
        stakingState.stakingBalances[_user] = 0;
        stakingState.totalBalance -= amount;
        stakingState.lastClaimedEpoch[_user] = 0;
        stakingState.withdrawalRequestEpoch[_user] = 0;
        // Transfer the staked tokens to the user
        _mxc().transfer(_user, amount);
        emit Withdrawal(_user, amount);
    }

    /// @dev System deposits reward to all users based on their stake.
    function stakingDepositReward()
    external
    onlyFromNamed(LibStrings.B_TAIKO)
    whenNotPaused nonReentrant
    {
        // Update last reward timestamp
        if (stakingState.lastDepositRewardTime == 0) {
            stakingState.lastDepositRewardTime = uint64(block.timestamp);
        }

        // Calculate time elapsed since last reward distribution
        uint256 timeElapsed = block.timestamp - uint256(stakingState.lastDepositRewardTime);
        if (timeElapsed == 0) return;
        // Update last reward timestamp
        uint256 _rewardAmount = calcReward();
        if (_rewardAmount == 0) return;
        _mxc().mint(address(this), _rewardAmount);
        stakingState.totalReward += _rewardAmount;
        stakingState.epochReward[getCurrentEpoch()] += _rewardAmount;
        stakingState.lastDepositRewardTime = uint64(block.timestamp);
        emit DepositReward(msg.sender, _rewardAmount);
    }

    /// @dev deposits reward to epoch reward
    /// @param _amount The amount of token to deposit.
    function stakingDepositReward(uint256 _amount)
    external
    whenNotPaused nonReentrant
    {
        if (_amount == 0) {
            revert INSUFFICIENT_DEPOSIT();
        }
        _mxc().transferFrom(msg.sender, address(this), _amount);
        stakingState.totalReward += _amount;
        stakingState.epochReward[getCurrentEpoch()] += _amount;
        stakingState.lastDepositRewardTime = uint64(block.timestamp);
        emit DepositReward(msg.sender, _amount);
    }

    /// @dev Calculate the debt reward owed to a user
    /// @param user The user address to credit.
    /// @return The debt reward owed to the user
    function stakingCalculateRewardDebt(
        address user
    )
    public
    view
    returns (uint256)
    {
        if (stakingState.stakingBalances[user] == 0) return 0;

        uint256 lastClaimedEpoch = stakingState.lastClaimedEpoch[user];
        uint256 currentEpoch = getCurrentEpoch();

        if (lastClaimedEpoch >= currentEpoch - 1) return 0; // Reward already claimed for prev epoch

        uint256 debtReward = 0;

        // Calculate the reward based on the user's staked amount, total supply, and elapsed time
        uint256 share = stakingState.stakingBalances[user] * 1e5 / stakingState.totalBalance;

        if(currentEpoch - lastClaimedEpoch > 24) {
            lastClaimedEpoch = currentEpoch - 24;
        }

        while (lastClaimedEpoch < currentEpoch - 1) {
            uint256 epochReward = stakingState.epochReward[lastClaimedEpoch + 1];
            if (epochReward > 0) {
                debtReward += (epochReward * share) / 1e5;
            }
            lastClaimedEpoch++;
        }

        return debtReward;
    }

    /// @dev Check user already claimed
    function _isClaimed(address user) internal view returns (bool) {
        if (stakingState.stakingBalances[user] == 0) return true;
        uint256 lastClaimedEpoch = stakingState.lastClaimedEpoch[user];
        uint256 currentEpoch = getCurrentEpoch();
        if (lastClaimedEpoch >= currentEpoch - 1) return true;
        return false;
    }

    /// @dev ZkCenter claim the reward from a user, then distribute it
    /// @param _user The user address to credit.
    function stakingClaimReward(address _user)
    external
    whenNotPaused nonReentrant
    onlyFromOptionalNamed(LibStrings.B_ZKCENTER)
    returns (uint256) {
        uint256 currentEpoch = getCurrentEpoch();
        uint256 reward = stakingCalculateRewardDebt(_user); // Calculate the interest owed to the user
        stakingState.lastClaimedEpoch[_user] = currentEpoch - 1;
        if (reward == 0) return 0;
        _mxc().transfer(msg.sender, reward);
        emit ClaimReward(msg.sender, reward, currentEpoch - 1);
        return reward;
    }

    /// @dev Slash a user's bond balance. Dishonest behavior and failure to meet online rate targets
    /// during the period
    /// @param _user The user address to credit.
    /// @param _rate The rate to slash, 10 is 10%
    function stakingSlashing(
        address _user,
        uint256 _rate
    ) external onlyFromOptionalNamed(LibStrings.B_ZKCENTER)
    {
        uint256 amount = stakingState.stakingBalances[_user];
        if (amount == 0) return;
        if (!_isClaimed(_user)) revert REWARD_NOT_CLAIM();
        uint256 punishAmount = amount * _rate / 100;
        stakingState.stakingBalances[_user] -= punishAmount;
        stakingState.totalBalance -= punishAmount;
        emit Slash(_user, punishAmount);
    }

    /// @dev punish user epoch reward
    /// @param _user The user address to credit.
    /// @param _epochAmount The epoch amount to punish
    function pauseUserReward(
        address _user,
        uint256 _epochAmount
    ) external onlyFromOptionalNamed(LibStrings.B_ZKCENTER)
    {
        uint256 currentEpoch = getCurrentEpoch();
        if (!_isClaimed(_user)) revert REWARD_NOT_CLAIM();
        stakingState.lastClaimedEpoch[_user] = currentEpoch + _epochAmount;
    }

    /// @dev Get the staking state of a user
    /// @param _user The user address to credit.
    /// @return The staking balance, last claimed epoch, and withdrawal request epoch of the user
    /// @return The staking balance of the user
    /// @return The last claimed epoch of the user
    function stakingUserState(address _user) external view returns (uint256, uint256, uint256) {
        return (
            stakingState.stakingBalances[_user],
            stakingState.lastClaimedEpoch[_user],
            stakingState.withdrawalRequestEpoch[_user]
        );
    }

    /// @dev Get the epoch reward
    /// @param epoch The epoch ID
    /// @return The reward for the epoch
    function getEpochReward(uint256 epoch) external view returns (uint256) {
        return stakingState.epochReward[epoch];
    }

    /// @dev Get the current epoch based on the current block timestamp
    /// @return The current epoch ID
    function getCurrentEpoch() public view returns (uint256) {
        return _currentEpoch;	// Return Mock epoch
    }

    function setCurrentEpoch(uint256 value) external {
        _currentEpoch = value;	// Set Mock epoch
    }

    /// @dev Calculate the reward for the current epoch
    /// @return The reward for the current epoch
    function calcReward()
    internal
    view
    returns (uint256)
    {
        uint256 elapsedSeconds = block.timestamp - stakingState.lastDepositRewardTime;
        uint256 reward = (_mxc().totalSupply() * 950 / 10000 / 365 days) * elapsedSeconds; // max
        // apr ~= 9.99%

        // Limit max reward to 1e5
        if (reward > 1e5 * 1 ether) {
            reward = 1e5 * 1 ether;
        }
        // Round down to the nearest 1e16
        return (reward / 1e16) * 1e16;
    }

    // For Mock
    function _mxc() private view returns (IMxcTokenMock) {
        return mxcTokenMock;
    }
}

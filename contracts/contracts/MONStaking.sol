// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MONStaking {
    
    struct StakingTier {
        uint256 minStake;
        uint256 multiplier;
        string name;
    }

    mapping(address => uint256) public stakes;
    mapping(address => uint256) public stakeStartTime;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public userMultiplier;

    uint256 public totalStaked;
    uint256 public totalStakers;
    uint256 public constant REWARD_RATE = 1000000000000000; // 0.001 MON per second per base multiplier

    StakingTier[5] public tiers;

    event Staked(address indexed user, uint256 amount, uint256 multiplier);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    error ZeroStakeAmount();
    error NoActiveStake();
    error StakeLocked(uint256 lockPeriodRemaining);
    error NothingToClaim();

    constructor() {
        // Tier 1: Basic Staker (100 MON)
        tiers[0] = StakingTier({
            minStake: 100 * 1e18,
            multiplier: 100, // 1x
            name: "Basic Staker"
        });

        // Tier 2: Devoted Follower (500 MON)
        tiers[1] = StakingTier({
            minStake: 500 * 1e18,
            multiplier: 125, // 1.25x
            name: "Devoted Follower"
        });

        // Tier 3: Holy Disciple (2,500 MON)
        tiers[2] = StakingTier({
            minStake: 2500 * 1e18,
            multiplier: 150, // 1.5x
            name: "Holy Disciple"
        });

        // Tier 4: Apostle (10,000 MON)
        tiers[3] = StakingTier({
            minStake: 10000 * 1e18,
            multiplier: 200, // 2x
            name: "Apostle"
        });

        // Tier 5: High Priest (25,000+ MON)
        tiers[4] = StakingTier({
            minStake: 25000 * 1e18,
            multiplier: 250, // 2.5x
            name: "High Priest"
        });
    }

    function stake(uint256 _amount) external payable {
        if (_amount == 0) revert ZeroStakeAmount();
        require(msg.value >= _amount, "Insufficient MON sent");
        _stake(_amount);
    }

    function _stake(uint256 _amount) internal {
        // If user has existing stake, add to it
        if (stakes[msg.sender] > 0) {
            // Claim pending rewards first
            uint256 pending = calculateRewards(msg.sender);
            if (pending > 0) {
                _claimRewards(pending);
            }
            stakes[msg.sender] += _amount;
        } else {
            stakes[msg.sender] = _amount;
            stakeStartTime[msg.sender] = block.timestamp;
            lastClaimTime[msg.sender] = block.timestamp;
            totalStakers += 1;
        }
        
        totalStaked += _amount;
        userMultiplier[msg.sender] = _calculateMultiplier(stakes[msg.sender]);
        
        emit Staked(msg.sender, _amount, userMultiplier[msg.sender]);
    }

    function unstake(uint256 _amount) external {
        if (stakes[msg.sender] == 0) revert NoActiveStake();
        if (_amount == 0) revert ZeroStakeAmount();
        require(_amount <= stakes[msg.sender], "Amount exceeds staked balance");

        // Claim pending rewards first
        uint256 pending = calculateRewards(msg.sender);
        if (pending > 0) {
            _claimRewards(pending);
        }

        stakes[msg.sender] -= _amount;
        totalStaked -= _amount;

        // Update multiplier based on remaining stake
        if (stakes[msg.sender] > 0) {
            userMultiplier[msg.sender] = _calculateMultiplier(stakes[msg.sender]);
        } else {
            userMultiplier[msg.sender] = 0;
            totalStakers -= 1;
        }

        // Transfer MON back to user
        payable(msg.sender).transfer(_amount);

        emit Unstaked(msg.sender, _amount);
    }

    function claimRewards() external {
        if (stakes[msg.sender] == 0) revert NoActiveStake();

        uint256 pending = calculateRewards(msg.sender);
        if (pending == 0) revert NothingToClaim();

        _claimRewards(pending);
    }

    function _claimRewards(uint256 _amount) internal {
        lastClaimTime[msg.sender] = block.timestamp;
        payable(msg.sender).transfer(_amount);
        emit RewardsClaimed(msg.sender, _amount);
    }

    function calculateRewards(address _user) public view returns (uint256) {
        if (stakes[_user] == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - lastClaimTime[_user];
        uint256 multiplier = userMultiplier[_user];

        // Reward formula: base_rate * time_elapsed * multiplier / 100
        uint256 rewards = (REWARD_RATE * timeElapsed * multiplier) / 100;

        return rewards;
    }

    function _calculateMultiplier(uint256 _stakeAmount) internal view returns (uint256) {
        // Start from highest tier and work down
        for (int256 i = 4; i >= 0; i--) {
            uint256 tierIndex = uint256(i);
            if (_stakeAmount >= tiers[tierIndex].minStake) {
                return tiers[tierIndex].multiplier;
            }
        }
        return 100; // Default to 1x if stake is below all tiers
    }

    function getUserTier(address _user) external view returns (StakingTier memory) {
        uint256 multiplier = userMultiplier[_user];
        for (uint i = 0; i < tiers.length; i++) {
            if (tiers[i].multiplier == multiplier) {
                return tiers[i];
            }
        }
        return tiers[0]; // Return lowest tier as default
    }

    function getAllTiers() external view returns (StakingTier[5] memory) {
        StakingTier[5] memory allTiers;
        for (uint i = 0; i < 5; i++) {
            allTiers[i] = tiers[i];
        }
        return allTiers;
    }

    function getStakeInfo(address _user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lastClaimTimeValue,
        uint256 multiplier,
        uint256 pendingRewards
    ) {
        return (
            stakes[_user],
            stakeStartTime[_user],
            lastClaimTime[_user],
            userMultiplier[_user],
            calculateRewards(_user)
        );
    }

    function getGlobalStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalStakers
    ) {
        return (totalStaked, _totalStakers);
    }

    receive() external payable {
        // Allow direct MON transfers for staking
        if (msg.value > 0) {
            _stake(msg.value);
        }
    }
}
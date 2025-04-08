import {expect} from 'chai';
import {Signer} from 'ethers';
import {ethers} from 'hardhat';

import {L1StakingMock, MiningGroupToken, MxcTokenMock, SgxMinerToken, ZkCenter} from '../typechain-types';

import {TestUtil} from './test_utils';

describe('staking', function() {
  let owner: Signer;
  let userAmy: Signer;
  let userBob: Signer;
  let proverService: Signer;

  let ownerAddress = '';
  let amyAddress = '';
  let bobAddress = '';

  let proxyZkCenter: ZkCenter;
  let proxySgxMinerToken: SgxMinerToken;
  let proxyMiningGroupToken: MiningGroupToken;
  let proxyL1StakingMock: L1StakingMock;
  let proxyMxcTokenMock: MxcTokenMock;

  before(async function() {
    [owner] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    // Create wallet for Prover Service
    const prover_rand_wallet = ethers.Wallet.createRandom();
    proverService = await prover_rand_wallet.connect(owner.provider);
    const proverServiceAddress = await proverService.getAddress();
    // Ready some ETH for test
    await owner.sendTransaction({to: proverServiceAddress, value: ethers.parseEther('10')});
    // Prepare contracts
    [proxyZkCenter, proxySgxMinerToken, proxyMiningGroupToken, proxyL1StakingMock, proxyMxcTokenMock] =
        await TestUtil.prepareContracts(proverService);

    //
    console.log(`        owner: ${ownerAddress}`);
    console.log(`proverService: ${proverServiceAddress} ${
        ethers.formatEther(await proxyMxcTokenMock.balanceOf(proverServiceAddress))} MXC`);

    // Create wallet for users
    let rand_wallet = ethers.Wallet.createRandom();
    userAmy = await rand_wallet.connect(owner.provider);
    rand_wallet = ethers.Wallet.createRandom();
    userBob = await rand_wallet.connect(owner.provider);
    amyAddress = await userAmy.getAddress();
    bobAddress = await userBob.getAddress();

    // Ready some ETH for test
    await owner.sendTransaction({to: amyAddress, value: ethers.parseEther('10')});
    await owner.sendTransaction({to: bobAddress, value: ethers.parseEther('10')});
    // Ready MXC to Amy and Bob
    await proxyMxcTokenMock.transfer(amyAddress, ethers.parseEther('10000000'));
    await proxyMxcTokenMock.transfer(bobAddress, ethers.parseEther('10000000'));
    console.log(`      userAmy: ${amyAddress} ${ethers.formatEther(await proxyMxcTokenMock.balanceOf(amyAddress))} MXC`);
    console.log(`      userBob: ${bobAddress} ${ethers.formatEther(await proxyMxcTokenMock.balanceOf(bobAddress))} MXC`);
  });

  beforeEach(async function() {});

  //========================================================================
  //========================================================================
  describe('Basic functions', async function() {
    it('name2()', async function() {
      expect((await proxyZkCenter.name2()).startsWith('ZkCenter')).to.be.true;
      expect((await proxySgxMinerToken.name2()).startsWith('SgxMinerToken')).to.be.true;
      expect((await proxyMiningGroupToken.name2()).startsWith('MiningGroupToken')).to.be.true;
    });

    it('ZkCenter set rate', async function() {
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      await expect(proxyZkCenter.setFee(1000, 8001)).to.be.revertedWithCustomError(proxyZkCenter, 'ZKCENTER_VALUE_TOO_HIGH');
      await expect(amyZkCenter.setFee(200, 1900)).to.be.revertedWithCustomError(proxyZkCenter, 'CONTROLLABLE_ACCESS_DENIED');
      // Modify
      await proxyZkCenter.setFee(123, 4567);
      expect(await proxyZkCenter.adminFee()).to.equal(123);
      expect(await proxyZkCenter.commissionRate()).to.equal(4567);
      // Set back to default
      await proxyZkCenter.setFee(200, 1900);
      expect(await proxyZkCenter.adminFee()).to.equal(200);
      expect(await proxyZkCenter.commissionRate()).to.equal(1900);
    });

    it('Token name and symbol', async function() {
      expect((await proxySgxMinerToken.name()).startsWith('SgxMinerToken')).to.be.true;
      expect((await proxySgxMinerToken.symbol()).startsWith('ZkMiner')).to.be.true;
      expect((await proxyMiningGroupToken.name()).startsWith('MiningGroupToken')).to.be.true;
      expect((await proxyMiningGroupToken.symbol()).startsWith('ZkGroup')).to.be.true;
    });

    it('ZkCenter setup', async function() {
      expect(await proxyZkCenter.sgxMinerToken()).to.equal(await proxySgxMinerToken.getAddress());
      expect(await proxyZkCenter.miningGroupToken()).to.equal(await proxyMiningGroupToken.getAddress());
      expect(await proxyZkCenter.l1Staking()).to.equal(await proxyL1StakingMock.getAddress());
    });

    it('ZkCenter Controllers', async function() {
      const proverZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, proverService);
      const otherZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);

      // Both contract owner and Prover Service is controller
      expect(await proxyZkCenter.isController()).to.equal(true);
      expect(await proverZkCenter.isController()).to.equal(true);

      // Other account is not a controller
      expect(await otherZkCenter.isController()).to.equal(false);
    });
  });

  //========================================================================
  //========================================================================
  describe('Miner NFT', async function() {
    const sgx_instance_id = 10;

    let session_sgx_id = sgx_instance_id;

    it('mintMiner()', async function() {
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);

      const receipt = await (await amyZkCenter.minerMint(sgx_instance_id)).wait();
      // mintMiner will call contract SgxMinerToken for mint, a event will emitted
      const events = await TestUtil.filterReceiptEvent(proxySgxMinerToken, receipt!, 'Minted');
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(sgx_instance_id);

      // The initial NFT owner is ZkCenter
      const miner_owner = await proxyZkCenter.minerGetOwner(sgx_instance_id);
      expect(miner_owner).to.equal(await amyZkCenter.getAddress());
    });

    it('Invalid direct mint', async function() {
      session_sgx_id++;

      // Use owner
      await expect(proxySgxMinerToken.mint(session_sgx_id))
          .to.be.revertedWithCustomError(proxySgxMinerToken, 'ACCESSCONTROL_DENIED');

      // Use other
      const amySgxMinerToken = await TestUtil.attachSgxMinerToken(proxySgxMinerToken, userAmy);

      await expect(amySgxMinerToken.mint(session_sgx_id)).to.be.revertedWithCustomError(proxySgxMinerToken, 'ACCESSCONTROL_DENIED');
    });

    it('Duplicate mint', async function() {
      session_sgx_id++;
      await expect(proxyZkCenter.minerMint(session_sgx_id)).not.to.be.reverted;
      await expect(proxyZkCenter.minerMint(session_sgx_id)).to.be.revertedWithCustomError(proxySgxMinerToken, 'ALREADY_MINTED');
    });

    it('Claim Miner without registration', async function() {
      const otherZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      await expect(otherZkCenter.minerClaim(sgx_instance_id)).to.be.revertedWithCustomError(proxyZkCenter, 'MINER_NOT_REGISTERED');
    });

    it('Register Miner by non controller', async function() {
      const otherZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      await expect(otherZkCenter.minerRegister(sgx_instance_id, amyAddress))
          .to.be.revertedWithCustomError(proxyZkCenter, 'CONTROLLABLE_ACCESS_DENIED');
    });

    it('Register and Claim Miner', async function() {
      // Prover Service Register miner for Amy
      const proverZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, proverService);
      const receiptReg = await (await proverZkCenter.minerRegister(sgx_instance_id, amyAddress)).wait();
      const eventsReg = await TestUtil.filterReceiptEvent(proverZkCenter, receiptReg!, 'MinerRegistered');
      expect(eventsReg.length).to.equal(1);
      expect(eventsReg[0].args[0]).to.equal(sgx_instance_id);  // sgxInstanceId
      expect(eventsReg[0].args[1]).to.equal(amyAddress);       // to

      // Claim by Bob will reverted
      const bobZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userBob);
      await expect(bobZkCenter.minerClaim(sgx_instance_id)).to.be.revertedWithCustomError(proxyZkCenter, 'MINER_NOT_REGISTERED');

      // Claim by Amy
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      const receiptClaim = await (await amyZkCenter.minerClaim(sgx_instance_id)).wait();
      // claimMiner will call contract SgxMinerToken safeTransferFrom, a event will emitted
      const eventsClaim = await TestUtil.filterReceiptEvent(proxySgxMinerToken, receiptClaim!, 'Transfer');
      expect(eventsClaim.length).to.equal(1);
      expect(eventsClaim[0].args[0]).to.equal(await amyZkCenter.getAddress());  // from
      expect(eventsClaim[0].args[1]).to.equal(amyAddress);                      // to
      expect(eventsClaim[0].args[2]).to.equal(sgx_instance_id);                 // tokenId

      const miner_owner = await proxyZkCenter.minerGetOwner(sgx_instance_id);
      expect(miner_owner).to.equal(amyAddress);
    });

    it('Claim again', async function() {
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      await expect(amyZkCenter.minerClaim(sgx_instance_id)).to.be.reverted;
    });

    it('Transfer ownership', async function() {
      session_sgx_id++;

      // ZkCenter & Prover Service
      const proverZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, proverService);

      // Mint miner. Register and claim a miner by Amy
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      await (await proxyZkCenter.minerMint(session_sgx_id)).wait();
      await (await proverZkCenter.minerRegister(session_sgx_id, amyAddress)).wait();
      await (await amyZkCenter.minerClaim(session_sgx_id)).wait();
      expect(await proxyZkCenter.minerGetOwner(session_sgx_id)).to.equal(amyAddress);

      // Amy approve ZkCenter to do the transfer
      const zkCenterAddress = await proxyZkCenter.getAddress()
      const amySgxMinerToken = await TestUtil.attachSgxMinerToken(proxySgxMinerToken, userAmy);
      await amySgxMinerToken.approve(zkCenterAddress, session_sgx_id);
      const approvedTo = await amySgxMinerToken.getApproved(session_sgx_id);
      expect(approvedTo).to.equal(zkCenterAddress);

      // Bob register miner
      const receiptReg = await (await proverZkCenter.minerRegister(session_sgx_id, bobAddress)).wait();
      const eventsReg = await TestUtil.filterReceiptEvent(proverZkCenter, receiptReg!, 'MinerRegistered');
      expect(eventsReg.length).to.equal(1);
      expect(eventsReg[0].args[0]).to.equal(session_sgx_id);  // sgxInstanceId
      expect(eventsReg[0].args[1]).to.equal(bobAddress);      // to

      // Bob Claim the miner from Amy
      const bobZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userBob);
      const receiptClaim = await (await bobZkCenter.minerClaim2(session_sgx_id, amyAddress)).wait();
      const eventsClaim = await TestUtil.filterReceiptEvent(proxySgxMinerToken, receiptClaim!, 'Transfer');
      expect(eventsClaim.length).to.equal(1);
      expect(eventsClaim[0].args[0]).to.equal(amyAddress);      // from
      expect(eventsClaim[0].args[1]).to.equal(bobAddress);      // to
      expect(eventsClaim[0].args[2]).to.equal(session_sgx_id);  // tokenId
      const miner_owner = await proxyZkCenter.minerGetOwner(session_sgx_id);
      expect(miner_owner).to.equal(bobAddress);
    });
  });

  //========================================================================
  //========================================================================
  describe('Mining Group NFT', async function() {
    it('Create & Delete', async function() {
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);

      // Create Group
      const receipt_create = await (await amyZkCenter.miningGroupCreate()).wait();
      // miningGroupCreate will call contract MiningGroupToken for mint, a event will emitted
      const events_create = await TestUtil.filterReceiptEvent(proxyMiningGroupToken, receipt_create!, 'Minted');
      expect(events_create.length).to.equal(1);
      expect(events_create[0].args[0]).not.to.null;
      expect(events_create[0].args[1]).to.equal(amyAddress);

      const group_id = events_create[0].args[0];

      // Only 1 NFT at this time. First Group ID will be 1, not zero.
      expect(await proxyZkCenter.miningGroupGetTotal()).to.equal(1);
      expect(group_id).to.equal(1);

      // Check owner
      const group_leader = await proxyZkCenter.miningGroupGetLeader(group_id);
      expect(group_leader).to.equal(amyAddress);

      // Check ID
      const id = await amyZkCenter.miningGroupGetId();
      expect(id).to.equal(group_id);

      // Delete Group
      const receipt_delete = await (await amyZkCenter.miningGroupDelete()).wait();
      // miningGroupDelete will call contract MiningGroupToken for mint, a event will emitted
      const events_delete = await TestUtil.filterReceiptEvent(proxyMiningGroupToken, receipt_delete!, 'Burned');
      expect(events_delete.length).to.equal(1);
      expect(events_delete[0].args[0]).not.to.null;
      expect(events_delete[0].args[1]).to.equal(amyAddress);

      //
      expect(await proxyZkCenter.miningGroupGetTotal()).to.equal(0);

      // Delete again
      await expect(amyZkCenter.miningGroupDelete()).to.be.revertedWithCustomError(proxyZkCenter, 'GROUP_NOT_EXIST');
    });


    it('No group', async function() {
      const bobZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userBob);
      await expect(bobZkCenter.miningGroupGetId()).to.be.revertedWithCustomError(proxyZkCenter, 'GROUP_NOT_EXIST');
    });

    it('Invalid direct mint', async function() {
      // Use owner
      await expect(proxyMiningGroupToken.mint(await owner.getAddress()))
          .to.be.revertedWithCustomError(proxySgxMinerToken, 'ACCESSCONTROL_DENIED');

      // Use other
      const amyMiningGroupToken = await TestUtil.attachMiningGroupToken(proxyMiningGroupToken, userAmy);

      await expect(amyMiningGroupToken.mint(await userAmy.getAddress()))
          .to.be.revertedWithCustomError(proxySgxMinerToken, 'ACCESSCONTROL_DENIED');
    });
  });

  //========================================================================
  //========================================================================
  describe('Staking', async function() {
    const sgx_instance_id = 100;
    const starting_epoch = 1000;

    it('Prepare miner', async function() {
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      const proverZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, proverService);

      // Mint miner. Register and claim a miner by Amy
      await (await proxyZkCenter.minerMint(sgx_instance_id)).wait();
      await (await proverZkCenter.minerRegister(sgx_instance_id, amyAddress)).wait();
      await (await amyZkCenter.minerClaim(sgx_instance_id)).wait();
      expect(await proxyZkCenter.minerGetOwner(sgx_instance_id)).to.equal(amyAddress);
    });

    it('Stake without group', async function() {
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      const deposit_amount = await proxyL1StakingMock.MIN_DEPOSIT();
      await expect(amyZkCenter.stakeDeposit(deposit_amount)).to.be.revertedWithCustomError(proxyZkCenter, 'STAKE_GROUP_NOT_FOUND');
    });

    it('Create Group and stake', async function() {
      const min_deposit = await proxyL1StakingMock.MIN_DEPOSIT();
      const lock_period = await proxyL1StakingMock.WITHDRAWAL_LOCK_EPOCH();
      const admin_fee = await proxyZkCenter.adminFee();
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      const amyMxcToken = await TestUtil.attachMxcToken(proxyMxcTokenMock, userAmy);
      const l1StakingAddress = await proxyL1StakingMock.getAddress();
      const zkCenterAddress = await proxyZkCenter
                                  .getAddress()

                              //
                              await proxyL1StakingMock.setCurrentEpoch(starting_epoch);
      let current_epoch = await proxyL1StakingMock.getCurrentEpoch();

      // Amy create mining group
      await (await amyZkCenter.miningGroupCreate()).wait();
      const group_id = await amyZkCenter.miningGroupGetId();
      expect(await proxyZkCenter.miningGroupGetLeader(group_id)).to.equal(amyAddress);

      // Approve L1Staking to do MXC transfer
      await amyMxcToken.approve(l1StakingAddress, min_deposit);

      // Stake
      const receipt_deposit = await (await amyZkCenter.stakeDeposit(min_deposit)).wait();
      // stakeDeposit will call contract L1Staking, a L1Staking event will emitted
      const events_deposit = await TestUtil.filterReceiptEvent(proxyL1StakingMock, receipt_deposit!, 'Staking');
      expect(events_deposit.length).to.equal(1);
      expect(events_deposit[0].args[0]).to.equal(amyAddress);
      expect(events_deposit[0].args[1]).to.equal(min_deposit);

      // Stake again
      await amyMxcToken.approve(l1StakingAddress, min_deposit);
      await (await amyZkCenter.stakeDeposit(min_deposit)).wait();

      // Check status
      const status1 = await amyZkCenter.stakeGetStatus();
      expect(status1.stakingGroup).to.equal(group_id);
      expect(status1.stakedAmount).to.equal(min_deposit * 2n);
      expect(status1.lastClaimedEpoch).to.equal(current_epoch - 1n);
      expect(status1.withdrawalRequestEpoch).to.equal(0);

      // EPOCH move forward
      const num_of_epoch_pass = 10;
      const reward_per_epoch = ethers.parseEther('10000');
      for (let i = 0; i < num_of_epoch_pass; i++) {
        await proxyMxcTokenMock.approve(l1StakingAddress, reward_per_epoch);
        await proxyL1StakingMock['stakingDepositReward(uint256)'](reward_per_epoch);
        current_epoch++;
        await proxyL1StakingMock.setCurrentEpoch(current_epoch);
      }
      const expected_gross = ethers.parseEther('100000');
      expect(await amyZkCenter.stakeGetGrossReward()).to.equal(expected_gross);

      // Delete group here will revert
      await expect(amyZkCenter.miningGroupDelete()).to.be.revertedWithCustomError(proxyZkCenter, 'GROUP_WITH_REWARD');

      // Check ZkCenter admin fee
      expect(admin_fee).to.equal(200);  // 2% admin fee

      // Claim
      const expected_admin_fee = ethers.parseEther('2000');
      const expected_net_reward = expected_gross - expected_admin_fee;
      const balance_before_claim = await proxyMxcTokenMock.balanceOf(amyAddress);
      await amyZkCenter.stakeClaimReward();
      const balance_after_claim = await proxyMxcTokenMock.balanceOf(amyAddress);
      expect(balance_after_claim - balance_before_claim).to.equal(expected_net_reward);

      // Delete group here will revert
      await expect(amyZkCenter.miningGroupDelete()).to.be.revertedWithCustomError(proxyZkCenter, 'GROUP_WITH_STAKING');

      // Withdraw
      await (await amyZkCenter.stakeRequestWithdraw(false)).wait();
      expect((await amyZkCenter.stakeGetStatus()).withdrawalRequestEpoch).to.equal(current_epoch);
      current_epoch += lock_period;
      await proxyL1StakingMock.setCurrentEpoch(current_epoch);
      await amyZkCenter.stakeClaimReward();   // Claim any remaining reward before withdraw
      const balance_before_withdraw = await proxyMxcTokenMock.balanceOf(amyAddress);
      const receipt_withdraw = await (await amyZkCenter.stakeWithdraw()).wait();
      // stakeWithdraw will call contract L1Staking, a L1Staking event will emitted
      const events_withdraw = await TestUtil.filterReceiptEvent(proxyL1StakingMock, receipt_withdraw!, 'Withdrawal');
      expect(events_withdraw.length).to.equal(1);
      expect(events_withdraw[0].args[0]).to.equal(amyAddress);
      expect(events_withdraw[0].args[1]).to.equal(min_deposit * 2n);
      const balance_after_withdraw = await proxyMxcTokenMock.balanceOf(amyAddress);
      expect(balance_after_withdraw - balance_before_withdraw).to.equal(min_deposit * 2n);

      // Delete the group
      await (await amyZkCenter.miningGroupDelete()).wait();
      await expect(amyZkCenter.miningGroupGetId()).to.be.revertedWithCustomError(proxyZkCenter, 'GROUP_NOT_EXIST');
    });

    it('Stake to group', async function() {
      const min_deposit = await proxyL1StakingMock.MIN_DEPOSIT();
      const lock_period = await proxyL1StakingMock.WITHDRAWAL_LOCK_EPOCH();
      const admin_fee = await proxyZkCenter.adminFee();
      const commission_rate = await proxyZkCenter.commissionRate();
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      const amyMxcToken = await TestUtil.attachMxcToken(proxyMxcTokenMock, userAmy);
      const bobZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userBob);
      const bobMxcToken = await TestUtil.attachMxcToken(proxyMxcTokenMock, userBob);
      const l1StakingAddress = await proxyL1StakingMock.getAddress();

      //
      let current_epoch = await proxyL1StakingMock.getCurrentEpoch();

      // Owner create a dummy group
      await (await proxyZkCenter.miningGroupCreate()).wait();
      await (await amyZkCenter.miningGroupCreate()).wait();

      // Amy stake
      await amyMxcToken.approve(l1StakingAddress, min_deposit);
      await (await amyZkCenter.stakeDeposit(min_deposit)).wait();

      // List of group (total 2, 1st is dummy, 2nd is amy)
      const total_group = await proxyZkCenter.miningGroupGetTotal();
      expect(total_group).to.equal(2);
      expect(await proxyZkCenter.miningGroupGetLeader(await proxyZkCenter.miningGroupGetIdByIndex(0))).to.equal(ownerAddress);
      const group_id = await proxyZkCenter.miningGroupGetIdByIndex(1);
      const group_leader = await proxyZkCenter.miningGroupGetLeader(group_id);
      expect(group_leader).to.equal(amyAddress);

      // Bob stake to Amy's group
      await bobMxcToken.approve(l1StakingAddress, min_deposit);
      const receipt_deposit = await (await bobZkCenter.stakeToGroup(group_id, min_deposit)).wait();
      // stakeDeposit will call contract L1Staking, a L1Staking event will emitted
      const events_deposit = await TestUtil.filterReceiptEvent(proxyL1StakingMock, receipt_deposit!, 'Staking');
      expect(events_deposit.length).to.equal(1);
      expect(events_deposit[0].args[0]).to.equal(bobAddress);
      expect(events_deposit[0].args[1]).to.equal(min_deposit);

      expect(await proxyZkCenter.miningGroupGetMemberCount(group_id)).to.equal(1);

      // Stake again
      await bobMxcToken.approve(l1StakingAddress, min_deposit);
      await (await bobZkCenter.stakeToGroup(group_id, min_deposit)).wait();

      // Stake to other group
      const other_group_id = await proxyZkCenter.miningGroupGetIdByIndex(0);
      await expect(bobZkCenter.stakeToGroup(other_group_id, min_deposit))
          .to.be.revertedWithCustomError(proxyZkCenter, 'STAKE_ALREADY_IN_GROUP');

      // Check status
      const status1 = await bobZkCenter.stakeGetStatus();
      expect(status1.stakingGroup).to.equal(group_id);
      expect(status1.stakedAmount).to.equal(min_deposit * 2n);
      expect(status1.lastClaimedEpoch).to.equal(current_epoch - 1n);
      expect(status1.withdrawalRequestEpoch).to.equal(0);

      // EPOCH move forward
      const num_of_epoch_pass = 10;
      const reward_per_epoch = ethers.parseEther('10000');
      for (let i = 0; i < num_of_epoch_pass; i++) {
        await proxyMxcTokenMock.approve(l1StakingAddress, reward_per_epoch);
        await proxyL1StakingMock['stakingDepositReward(uint256)'](reward_per_epoch);
        current_epoch++;
        await proxyL1StakingMock.setCurrentEpoch(current_epoch);
      }

      // Check gross reward, total gross is 10*10000 = 100,000 MXC
      const expected_gross_amy = ethers.parseEther('33333');
      const expected_gross_bob = ethers.parseEther('66666');
      expect(await amyZkCenter.stakeGetGrossReward()).to.equal(expected_gross_amy);
      expect(await bobZkCenter.stakeGetGrossReward()).to.equal(expected_gross_bob);

      // Check ZkCenter admin fee and Commission Rate
      expect(admin_fee).to.equal(200);         // 2% admin fee
      expect(commission_rate).to.equal(1900);  // 19% commission

      // Claim
      const expected_admin_fee = ethers.parseEther('1333.32');
      const expected_commisiion = ethers.parseEther('12666.54');
      const expected_net_bob = expected_gross_bob - expected_admin_fee - expected_commisiion;
      const balance_before_bob = await proxyMxcTokenMock.balanceOf(bobAddress);
      await bobZkCenter.stakeClaimReward();
      const balance_after_bob = await proxyMxcTokenMock.balanceOf(bobAddress);
      expect(balance_after_bob - balance_before_bob).to.equal(expected_net_bob);

      // Bob try claim commission
      expect(await bobZkCenter.stakeGetCommission()).to.equal(0);
      await expect(bobZkCenter.stakeClaimCommission()).to.be.revertedWithCustomError(proxyZkCenter, 'STAKE_NO_COMMISIION');

      // Check Amy's commission
      expect(await amyZkCenter.stakeGetCommission()).to.equal(expected_commisiion);
      const balance_before_amy = await proxyMxcTokenMock.balanceOf(amyAddress);
      const receipt_commission = await (await amyZkCenter.stakeClaimCommission()).wait();
      const events_commission = await TestUtil.filterReceiptEvent(proxyZkCenter, receipt_commission!, 'CommissionClaimed');
      expect(events_commission.length).to.equal(1);
      expect(events_commission[0].args[0]).to.equal(group_id);
      expect(events_commission[0].args[1]).to.equal(amyAddress);
      expect(events_commission[0].args[2]).to.equal(expected_commisiion);

      const balance_after_amy = await proxyMxcTokenMock.balanceOf(amyAddress);
      expect(balance_after_amy - balance_before_amy).to.equal(expected_commisiion);

      expect(await amyZkCenter.stakeGetCommission()).to.equal(0);
      await expect(amyZkCenter.stakeClaimCommission()).to.be.revertedWithCustomError(proxyZkCenter, 'STAKE_NO_COMMISIION');

      // Amy Withdraw 
      await (await amyZkCenter.stakeRequestWithdraw(false)).wait();
      current_epoch += lock_period;
      await proxyL1StakingMock.setCurrentEpoch(current_epoch);
      await amyZkCenter.stakeClaimReward();   // Claim any remaining reward before withdraw
      await (await amyZkCenter.stakeWithdraw()).wait();

      // Amy try delete group, but Bob still there
      await expect(amyZkCenter.miningGroupDelete()).to.be.revertedWithCustomError(proxyZkCenter, 'GROUP_WITH_MEMBERS');

      // Bob Withdraw 
      await (await bobZkCenter.stakeRequestWithdraw(false)).wait();
      current_epoch += lock_period;
      await proxyL1StakingMock.setCurrentEpoch(current_epoch);
      await bobZkCenter.stakeClaimReward();   // Claim any remaining reward before withdraw
      const balance_before_withdraw = await proxyMxcTokenMock.balanceOf(bobAddress);
      const receipt_withdraw = await (await bobZkCenter.stakeWithdraw()).wait();
      // stakeWithdraw will call contract L1Staking, a L1Staking event will emitted
      const events_withdraw = await TestUtil.filterReceiptEvent(proxyL1StakingMock, receipt_withdraw!, 'Withdrawal');
      expect(events_withdraw.length).to.equal(1);
      expect(events_withdraw[0].args[0]).to.equal(bobAddress);
      expect(events_withdraw[0].args[1]).to.equal(min_deposit * 2n);
      const balance_after_withdraw = await proxyMxcTokenMock.balanceOf(bobAddress);
      expect(balance_after_withdraw - balance_before_withdraw).to.equal(min_deposit * 2n);

      // Delete groups
      await amyZkCenter.miningGroupDelete();
      await proxyZkCenter.miningGroupDelete();
    });

    it('Group members', async function() {
      const min_deposit = await proxyL1StakingMock.MIN_DEPOSIT();
      const lock_period = await proxyL1StakingMock.WITHDRAWAL_LOCK_EPOCH();
      const amyZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userAmy);
      const bobZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, userBob);
      const l1StakingAddress = await proxyL1StakingMock.getAddress();

      //
      let current_epoch = await proxyL1StakingMock.getCurrentEpoch();

      // Create groups
      await (await amyZkCenter.miningGroupCreate()).wait();
      await (await bobZkCenter.miningGroupCreate()).wait();

      // Create members
      const amy_member_count = 12;
      const bob_member_count = 5;
      const amy_members:Signer[] = [];
      const bob_members:Signer[] = [];
      let rand_wallet:any;
      
      for (let i = 0; i < amy_member_count; i ++) {
        rand_wallet= ethers.Wallet.createRandom();
        const member = await rand_wallet.connect(owner.provider);
        const member_address = await member.getAddress();

        amy_members.push(member);
        await owner.sendTransaction({to: member_address, value: ethers.parseEther('10')});
        await proxyMxcTokenMock.transfer(member_address, ethers.parseEther('10000000'));
      }
      for (let i = 0; i < bob_member_count; i ++) {
        rand_wallet= ethers.Wallet.createRandom();
        const member = await rand_wallet.connect(owner.provider);
        const member_address = await member.getAddress();

        bob_members.push(member);
        await owner.sendTransaction({to: member_address, value: ethers.parseEther('10')});
        await proxyMxcTokenMock.transfer(member_address, ethers.parseEther('10000000'));
      }

      // Join group
      const amy_group_id = await proxyZkCenter.miningGroupGetIdByIndex(0);
      expect(await proxyZkCenter.miningGroupGetLeader(amy_group_id)).to.equal(amyAddress);
      for (let i = 0; i < amy_member_count; i ++) {
        const memberZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, amy_members[i]);
        const memberMxcToken = await TestUtil.attachMxcToken(proxyMxcTokenMock, amy_members[i]);

        await memberMxcToken.approve(l1StakingAddress, min_deposit);
        await (await memberZkCenter.stakeToGroup(amy_group_id, min_deposit)).wait();
      }
      const bob_group_id = await proxyZkCenter.miningGroupGetIdByIndex(1);
      expect(await proxyZkCenter.miningGroupGetLeader(bob_group_id)).to.equal(bobAddress);
      for (let i = 0; i < bob_member_count; i ++) {
        const memberZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, bob_members[i]);
        const memberMxcToken = await TestUtil.attachMxcToken(proxyMxcTokenMock, bob_members[i]);

        await memberMxcToken.approve(l1StakingAddress, min_deposit);
        await (await memberZkCenter.stakeToGroup(bob_group_id, min_deposit)).wait();
      }
      expect(await proxyZkCenter.miningGroupGetMemberCount(amy_group_id)).to.equal(amy_member_count);
      expect(await proxyZkCenter.miningGroupGetMemberCount(bob_group_id)).to.equal(bob_member_count);

      // Check members
      for (let i = 0; i < amy_member_count; i ++) {
        expect(await proxyZkCenter.miningGroupGetMemberByIndex(amy_group_id, i)).to.equal(await amy_members[i].getAddress());
      }
      await expect(proxyZkCenter.miningGroupGetMemberByIndex(amy_group_id, amy_member_count)).to.be.reverted;
      for (let i = 0; i < bob_member_count; i ++) {
        expect(await proxyZkCenter.miningGroupGetMemberByIndex(bob_group_id, i)).to.equal(await bob_members[i].getAddress());
      }
      await expect(proxyZkCenter.miningGroupGetMemberByIndex(bob_group_id, bob_member_count)).to.be.reverted;

      // Member withdraw
      const amyMember4ZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, amy_members[4]);
      await amyMember4ZkCenter.stakeRequestWithdraw(false);
      const amyMember7ZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, amy_members[7]);
      await amyMember7ZkCenter.stakeRequestWithdraw(false);
      const bobMember2ZkCenter = await TestUtil.attachZkCenter(proxyZkCenter, bob_members[2]);
      await bobMember2ZkCenter.stakeRequestWithdraw(false);
      current_epoch += lock_period;
      await proxyL1StakingMock.setCurrentEpoch(current_epoch);
      await amyMember4ZkCenter.stakeClaimReward();
      await amyMember4ZkCenter.stakeWithdraw();
      await bobMember2ZkCenter.stakeClaimReward();
      await bobMember2ZkCenter.stakeWithdraw();
      await amyMember7ZkCenter.stakeClaimReward();
      await amyMember7ZkCenter.stakeWithdraw();

      expect(await proxyZkCenter.miningGroupGetMemberCount(amy_group_id)).to.equal(amy_member_count - 2);
      expect(await proxyZkCenter.miningGroupGetMemberCount(bob_group_id)).to.equal(bob_member_count - 1);

      // Last member will swap in to deleted indexing space
      expect(await proxyZkCenter.miningGroupGetMemberByIndex(amy_group_id, 4)).to.equal(await amy_members[amy_member_count - 1].getAddress());
      expect(await proxyZkCenter.miningGroupGetMemberByIndex(amy_group_id, 5)).to.equal(await amy_members[5].getAddress());
      expect(await proxyZkCenter.miningGroupGetMemberByIndex(amy_group_id, 6)).to.equal(await amy_members[6].getAddress());
      expect(await proxyZkCenter.miningGroupGetMemberByIndex(amy_group_id, 7)).to.equal(await amy_members[amy_member_count - 2].getAddress());
      expect(await proxyZkCenter.miningGroupGetMemberByIndex(amy_group_id, 8)).to.equal(await amy_members[8].getAddress());

      expect(await proxyZkCenter.miningGroupGetMemberByIndex(bob_group_id, 1)).to.equal(await bob_members[1].getAddress());
      expect(await proxyZkCenter.miningGroupGetMemberByIndex(bob_group_id, 2)).to.equal(await bob_members[bob_member_count - 1].getAddress());
      expect(await proxyZkCenter.miningGroupGetMemberByIndex(bob_group_id, 3)).to.equal(await bob_members[3].getAddress());

      await proxyZkCenter.miningGroupGetMemberByIndex(amy_group_id, amy_member_count - 3);
      await expect(proxyZkCenter.miningGroupGetMemberByIndex(amy_group_id, amy_member_count - 2)).to.be.reverted;
      await proxyZkCenter.miningGroupGetMemberByIndex(bob_group_id, bob_member_count - 2);
      await expect(proxyZkCenter.miningGroupGetMemberByIndex(bob_group_id, bob_member_count - 1)).to.be.reverted;
    });
  });
});

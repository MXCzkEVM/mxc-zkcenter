
import './extension';

import {getImplementationAddress} from '@openzeppelin/upgrades-core';
import {ContractTransactionReceipt, EventLog, LogDescription, Signer} from 'ethers';
// const {ethers, upgrades} = require('hardhat');
import {ethers, upgrades} from 'hardhat';
import hre from 'hardhat';

import {L1StakingMock, MiningGroupToken, MxcTokenMock, SgxMinerToken, ZkCenter} from '../typechain-types';

class TestUtil {
  // Deploy to Hardhat and return contracts
  static _deployToHardhat(aProverService: Signer):
      Promise<[ZkCenter, SgxMinerToken, MiningGroupToken, L1StakingMock, MxcTokenMock]> {
    return new Promise(async function(aFulfill, aReject) {
      if (hre.network.name != 'hardhat') {
        aReject(`Current network (${hre.network.name}) is not hardnat`);
      }
      console.log('Deploying contracts to hardhat.');

      // Deploy
      const factoryMxcTokenMock = await ethers.getContractFactory('MxcTokenMock');
      const proxyMxcTokenMock = await upgrades.deployProxy(factoryMxcTokenMock, [], {timeout: (5 * 1000)}) as MxcTokenMock;
      await proxyMxcTokenMock.waitForDeployment();
      const addressMxcTokenMock = await proxyMxcTokenMock.getAddress();
      const addressImpMxcTokenMock = await getImplementationAddress(ethers.provider, addressMxcTokenMock);
      console.log(`MxcTokenMock deployed. Proxy: ${addressMxcTokenMock}. Implemenataion: ${addressImpMxcTokenMock}`);


      const factoryL1StakingMock = await ethers.getContractFactory('L1StakingMock');
      const proxyL1StakingMock =
          await upgrades.deployProxy(factoryL1StakingMock, [addressMxcTokenMock], {timeout: (5 * 1000)}) as L1StakingMock;
      await proxyL1StakingMock.waitForDeployment();
      const addressL1StakingMock = await proxyL1StakingMock.getAddress();
      const addressImpL1StakingMock = await getImplementationAddress(ethers.provider, addressL1StakingMock);
      console.log(`L1StakingMock deployed. Proxy: ${addressL1StakingMock}. Implemenataion: ${addressImpL1StakingMock}`);

      const factorySgxMinerToken = await ethers.getContractFactory('SgxMinerToken');
      const proxySgxMinerToken =
          await upgrades.deployProxy(factorySgxMinerToken, ['SgxMinerToken', 'ZkMiner'], {timeout: (5 * 60 * 1000)}) as
          SgxMinerToken;
      await proxySgxMinerToken.waitForDeployment();
      const addressSgxMinerToken = await proxySgxMinerToken.getAddress();
      const addressImpSgxMinerToken = await getImplementationAddress(ethers.provider, addressSgxMinerToken);
      console.log(`SgxMinerToken deployed. Proxy: ${addressSgxMinerToken}. Implemenataion: ${addressImpSgxMinerToken}`);

      const factoryMiningGroupToken = await ethers.getContractFactory('MiningGroupToken');
      const proxyMiningGroupToken =
          await upgrades.deployProxy(
              factoryMiningGroupToken, ['MiningGroupToken', 'ZkGroup'], {timeout: (5 * 60 * 1000)}) as MiningGroupToken;
      await proxyMiningGroupToken.waitForDeployment();
      const addressMiningGroupToken = await proxyMiningGroupToken.getAddress();
      const addressImpMiningGroupToken = await getImplementationAddress(ethers.provider, addressMiningGroupToken);
      console.log(`MiningGroupToken deployed. Proxy: ${addressMiningGroupToken}. Implemenataion: ${addressMiningGroupToken}`);

      const factoryZkCenter = await ethers.getContractFactory('ZkCenter');
      const proxyZkCenter = await upgrades.deployProxy(
                                factoryZkCenter, [addressSgxMinerToken, addressMiningGroupToken, addressL1StakingMock, addressMxcTokenMock],
                                {timeout: (5 * 60 * 1000)}) as ZkCenter;
      await proxyZkCenter.waitForDeployment();
      const addressZkCenter = await proxyZkCenter.getAddress();
      const addressImpZkCenter = await getImplementationAddress(ethers.provider, addressZkCenter);
      console.log(`ZkCenter deployed. Proxy: ${addressZkCenter}. Implemenataion: ${addressImpZkCenter}`);

      // Setup
      (await proxySgxMinerToken.setZkCenter(addressZkCenter)).wait();
      (await proxyMiningGroupToken.setZkCenter(addressZkCenter)).wait();
      (await proxyZkCenter.setController(await aProverService.getAddress(), true)).wait();

      //
      aFulfill([proxyZkCenter, proxySgxMinerToken, proxyMiningGroupToken, proxyL1StakingMock, proxyMxcTokenMock]);
    });
  }

  // Prepare contract
  static prepareContracts(aProverService: Signer):
      Promise<[ZkCenter, SgxMinerToken, MiningGroupToken, L1StakingMock, MxcTokenMock]> {
    if (hre.network.name == 'hardhat') {
      return TestUtil._deployToHardhat(aProverService);
    } else {
      return new Promise(async function(aFulfill, aReject) {
        aReject(`Network ${hre.network.name} not supported.`);
      });
    }
  }

  // Get contract with another signer attached
  static attachZkCenter(aContract: ZkCenter, aSigner: Signer): Promise<ZkCenter> {
    return new Promise(async function(aFulfill, aReject) {
      const factory = await ethers.getContractFactory('ZkCenter', aSigner);
      const other = factory.attach(await aContract.getAddress()) as ZkCenter;
      aFulfill(other)
    });
  }

  static attachSgxMinerToken(aContract: SgxMinerToken, aSigner: Signer): Promise<SgxMinerToken> {
    return new Promise(async function(aFulfill, aReject) {
      const factory = await ethers.getContractFactory('SgxMinerToken', aSigner);
      const other = factory.attach(await aContract.getAddress()) as SgxMinerToken;
      aFulfill(other)
    });
  }

  static attachMiningGroupToken(aContract: MiningGroupToken, aSigner: Signer): Promise<MiningGroupToken> {
    return new Promise(async function(aFulfill, aReject) {
      const factory = await ethers.getContractFactory('MiningGroupToken', aSigner);
      const other = factory.attach(await aContract.getAddress()) as MiningGroupToken;
      aFulfill(other)
    });
  }

  static attachMxcToken(aContract: MxcTokenMock, aSigner: Signer): Promise<MxcTokenMock> {
    return new Promise(async function(aFulfill, aReject) {
      const factory = await ethers.getContractFactory('MxcTokenMock', aSigner);
      const other = factory.attach(await aContract.getAddress()) as MxcTokenMock;
      aFulfill(other)
    });
  }

  static filterReceiptEvent(aContract: any, aReceipt: ContractTransactionReceipt|undefined, aEventName: string|undefined):
      Promise<LogDescription[]> {
    return new Promise(async function(aFulfill, aReject) {
      if (!aContract || !aReceipt) {
        aFulfill([]);
      } else if (aReceipt.logs.length == 0) {
        aFulfill([]);
      } else {
        let event_list: LogDescription[] = [];
        for (let i = 0; i < aReceipt.logs.length; i++) {
          const log = aReceipt.logs[i];
          if (log) {
            const decoded_log = aContract.interface.parseLog(log) as LogDescription;
            if ((decoded_log) && (decoded_log.fragment) && (decoded_log.fragment.type == 'event')) {
              if (((aEventName) && (decoded_log.name == aEventName)) || (!aEventName)) {
                event_list.push(decoded_log);
              }
            }
          }
        }
        aFulfill(event_list);
      }
    });
  }
}

//==========================================================================
//==========================================================================
export {
  TestUtil,
};
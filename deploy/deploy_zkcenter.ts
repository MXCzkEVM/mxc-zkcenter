import './extension';

import {getImplementationAddress} from '@openzeppelin/upgrades-core';
import {Signer} from 'ethers';
import hre from 'hardhat';
import {ethers, upgrades} from 'hardhat';
import fs from 'node:fs';

import {MiningGroupToken, SgxMinerToken, ZkCenter} from '../typechain-types';
import {ContractInfo} from '../typia/output/deployment_list';

import {DeploymentInfo} from './deployment_info';

//==========================================================================
// Global variables
//==========================================================================
const gDepolyment = new DeploymentInfo();

//==========================================================================
//==========================================================================
async function deployContract(aSigner: Signer, aContractFactoryName: string, aParam: any[]) {
  // get deployed info
  const deployed_info = gDepolyment.getContractInfo(aContractFactoryName);
  if (deployed_info) {
    // Try check name2
    let name2 = '';
    try {
      const factory = await ethers.getContractFactory(aContractFactoryName, aSigner);
      const proxy = factory.attach(deployed_info.proxyAddress);
      name2 = await proxy.name2()
    } catch (_) {
      console.log(`${aContractFactoryName}. Failed to call name2().`);
    }
    console.log(`${aContractFactoryName} already deployed, name2=${name2}, expected=${deployed_info.expectedName2}`);
    if (name2 == deployed_info.expectedName2) {
      console.log('  No need to upgrade.')
    } else {
      console.log(`Updating ${aContractFactoryName}.`)
      const factory = await ethers.getContractFactory(aContractFactoryName);
      const proxy = await upgrades.upgradeProxy(
          deployed_info.proxyAddress, factory, {redeployImplementation: 'always', timeout: (5 * 60 * 1000)});
      await proxy.waitForDeployment();
      const addressProxy = await proxy.getAddress();
      const addressImp = await getImplementationAddress(ethers.provider, addressProxy);
      console.log(`  Done. Proxy: ${addressProxy}. Implemenataion: ${addressImp}`);

      let name2 = '';
      try {
        name2 = await proxy.name2()
      } catch (_) {
        console.log(`${aContractFactoryName}. Failed to call name2().`);
      }

      // Save deployment detail
      const info: ContractInfo = {
        deployer: await aSigner.getAddress(),
        contractFactoryName: aContractFactoryName,
        contractName2: name2,
        timeUpdated: new Date().toJSON(),
        proxyAddress: addressProxy,
        impAddress: addressImp,
        expectedName2: name2,
      };
      gDepolyment.setContractInfo(info);
    }
  } else {
    // Deploy
    console.log(`Deploying ${aContractFactoryName}.`)
    const factory = await ethers.getContractFactory(aContractFactoryName);
    const proxy = await upgrades.deployProxy(factory, aParam, {timeout: (5 * 60 * 1000)});
    await proxy.waitForDeployment();
    const addressProxy = await proxy.getAddress();
    const addressImp = await getImplementationAddress(ethers.provider, addressProxy);
    console.log(`  Done. Proxy: ${addressProxy}. Implemenataion: ${addressImp}`);

    let name2 = '';
    try {
      name2 = await proxy.name2()
    } catch (_) {
      console.log(`${aContractFactoryName}. Failed to call name2().`);
    }

    // Save deployment detail
    const info: ContractInfo = {
      deployer: await aSigner.getAddress(),
      contractFactoryName: aContractFactoryName,
      contractName2: name2,
      timeUpdated: new Date().toJSON(),
      proxyAddress: addressProxy,
      impAddress: addressImp,
      expectedName2: name2,
    };
    gDepolyment.setContractInfo(info);
  }
  gDepolyment.save();
}

//==========================================================================
// The entry
//==========================================================================
async function main() {
  //
  console.log('ethers: ', ethers.version);

  //
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log(`signer: ${signerAddress}`);

  //
  const current_block = await ethers.provider.getBlockNumber();
  const starting_balance = await ethers.provider.getBalance(signerAddress, 'latest');
  const chain_id = (await ethers.provider.getNetwork()).chainId.toString();
  console.log(`Chain ID: ${chain_id}`);
  console.log(`Current Block: ${current_block}`);
  console.log(`Starting Balance: ${ethers.formatEther(starting_balance)}`);
  if (starting_balance == 0) {
    throw new Error('Balance is 0.');
  }

  // Load deployment data
  console.log(`Loading deployment info from ${gDepolyment.filePath()}.`);
  await gDepolyment.load();
  if (gDepolyment.list.chainId != chain_id) {
    throw new Error(`${gDepolyment.filePath()} file error. Chain ID mismatch.`);
  }
  if (gDepolyment.list.network != hre.network.name) {
    throw new Error(`${gDepolyment.filePath()} file error. Network name mismatch.`);
  }
  console.log(`  ${gDepolyment.list.contractList.length} contract(s) found.`);

  // Deploy Tokens
  await deployContract(signer, 'SgxMinerToken', ['SgxMinerToken', 'ZkMiner']);
  await deployContract(signer, 'MiningGroupToken', ['MiningGroupToken', 'ZkGroup']);

  // Address of TaikoL1
  let addressTaikoL1 = '';
  if (hre.network.name == 'arbitrum_sepolia') {
    addressTaikoL1 = '0x6a5c9E342d5FB5f5EF8a799f0cAAB2678C939b0B';
  }
  else  if (hre.network.name == 'arbitrum_one'){
    addressTaikoL1 = '0x54D8864e8855A7B66eE42B8F2Eaa0F2E06bd641a';
  }
  else {
    throw new Error(`Chain '${hre.network.name}' not suppoerted.`);
  }

  // Load JSON with abi
  const strTaikoL1 = fs.readFileSync('./mxc-mono/json/TaikoL1.sol/TaikoL1.json').toString();
  const strMxcToken = fs.readFileSync('./mxc-mono/json/MxcToken.sol/MxcToken.json').toString();
  const strL1Staking = fs.readFileSync('./mxc-mono/json/L1Staking.sol/L1Staking.json').toString();
  const jsonTaikoL1 = JSON.parse(strTaikoL1);
  const jsonMxcToken = JSON.parse(strMxcToken);
  const jsonL1Staking = JSON.parse(strL1Staking);

  // Resolve address via TaikoL1
  console.log(`TaikoL1: ${addressTaikoL1}`);
  const contractTaikoL1 = new ethers.Contract(addressTaikoL1, jsonTaikoL1.abi, ethers.provider);
  const addressMxcToken =
      (await contractTaikoL1.getFunction('resolve').staticCallResult(ethers.encodeBytes32String('taiko_token'), false))
          .toArray()[0];
  const addressL1Staking =
      (await contractTaikoL1.getFunction('resolve').staticCallResult(ethers.encodeBytes32String('staking'), false)).toArray()[0];
  console.log(`MxcToken: ${addressMxcToken}`);
  console.log(`L1Staking: ${addressL1Staking}`);

  // Read address from deployment info
  const addressSgxMinerToken = gDepolyment.getContractInfo('SgxMinerToken')?.proxyAddress;
  const addressMiningGroupToken = gDepolyment.getContractInfo('MiningGroupToken')?.proxyAddress;
  if (!addressSgxMinerToken) {
    throw new Error(`SgxMinerToken is not deployed.`);
  }
  if (!addressMiningGroupToken) {
    throw new Error(`MiningGroupToken is not deployed.`);
  }
  console.log(`SgxMinerToken: ${addressSgxMinerToken}`);
  console.log(`MiningGroupToken: ${addressMiningGroupToken}`);

  // Deploy ZkCenter
  await deployContract(signer, 'ZkCenter', [addressSgxMinerToken, addressMiningGroupToken, addressL1Staking, addressMxcToken]);

  // Read ZkCenter Address
  const addressZkCenter = gDepolyment.getContractInfo('ZkCenter')?.proxyAddress;
  if (!addressZkCenter) {
    throw new Error(`ZkCenter is not deployed.`);
  }

  // Set ZkCenter address to Tokens
  console.log('Set ZkCenter Address to Token Contracts.');
  const factorySgxMinerToken = await ethers.getContractFactory('SgxMinerToken', signer);
  const proxySgxMinerToken = factorySgxMinerToken.attach(addressSgxMinerToken) as SgxMinerToken;
  const factoryMiningGroupToken = await ethers.getContractFactory('MiningGroupToken', signer);
  const proxyMiningGroupToken = factoryMiningGroupToken.attach(addressMiningGroupToken) as MiningGroupToken;

  await proxySgxMinerToken.setZkCenter(addressZkCenter);
  await proxyMiningGroupToken.setZkCenter(addressZkCenter);
  console.log(' Done.');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error: Error) => {
  if (error.stack) {
    console.log(error.stack);
  } else {
    console.error(`ERROR: ${error}`);
  }
  process.exitCode = 1;
});
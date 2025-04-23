import {ethers} from 'hardhat';
import hre from 'hardhat';
import fs from 'node:fs';

import {ZkCenter} from '../typechain-types';

import {DeploymentInfo} from './deployment_info';

//==========================================================================
//==========================================================================
const gDepolyment = new DeploymentInfo();

//==========================================================================
// The entry
//==========================================================================
async function main() {
  //
  console.log('ethers: ', ethers.version);

  //
  const [signer] = await ethers.getSigners();
  console.log(`signer: ${signer.address}`);

  //
  const current_block = await ethers.provider.getBlockNumber();
  const chain_id = (await ethers.provider.getNetwork()).chainId.toString();
  console.log(`Current Block: ${current_block}`);
  console.log(`Chain ID: ${chain_id}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(signer.address, 'latest'))}`);

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

  //
  const deployed_info = gDepolyment.getContractInfo('ZkCenter');
  if (!deployed_info) {
    throw new Error('ZkCenter is not deploy yet.');
  }
  console.log(`ZkCenter: ${deployed_info.proxyAddress}`);

  const controller_address = process.env.CONTROLLER_ADDRESS || '';
  if (controller_address.length == 0) {
    throw new Error('Please set CONTROLLER_ADDRESS.');
  }

  // Set Controller
  const factoryZkCenter = await ethers.getContractFactory('ZkCenter', signer);
  const proxyZkCenter = factoryZkCenter.attach(deployed_info.proxyAddress) as ZkCenter;
  await proxyZkCenter.setController(controller_address, true);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
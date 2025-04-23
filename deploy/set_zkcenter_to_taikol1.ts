import { ethers } from 'hardhat';
import hre from 'hardhat';
import fs from 'node:fs';

import { DeploymentInfo } from './deployment_info';

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

  // Address of TaikoL1
  let addressTaikoL1 = '';
  if (hre.network.name == 'arbitrum_sepolia') {
    addressTaikoL1 = '0x6a5c9E342d5FB5f5EF8a799f0cAAB2678C939b0B';
  } else if (hre.network.name == 'arbitrum_one') {
    addressTaikoL1 = '0x54D8864e8855A7B66eE42B8F2Eaa0F2E06bd641a';
  } else {
    throw new Error(`Chain '${hre.network.name}' not suppoerted.`);
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

  // Load JSON with abi
  const strTaikoL1 = fs.readFileSync('./mxc-mono/json/TaikoL1.sol/TaikoL1.json').toString();
  const jsonTaikoL1 = JSON.parse(strTaikoL1);
  const strAddressManager = fs.readFileSync('./mxc-mono/json/AddressManager.sol/AddressManager.json').toString();
  const jsonAddressManager = JSON.parse(strAddressManager);

  // TakioL1
  console.log(`TaikoL1: ${addressTaikoL1}`);
  const contractTaikoL1 = new ethers.Contract(addressTaikoL1, jsonTaikoL1.abi, ethers.provider);

  // AddressManager
  const addressAddressManager = (await contractTaikoL1.getFunction('addressManager').staticCallResult()).toArray()[0];
  console.log(`AddressManager: ${addressAddressManager}`);
  const contractAddressManager = new ethers.Contract(addressAddressManager, jsonAddressManager.abi, ethers.provider);

  // Set ZkCenter Address
  const ZKCENTER_NAME = 'zkcenter';
  const deployed_info = gDepolyment.getContractInfo('ZkCenter');
  if (!deployed_info) {
    throw new Error('ZkCenter is not deploy yet.');
  }
  const byte32ZkCenterName = ethers.encodeBytes32String(ZKCENTER_NAME);

  console.log(`Set ${chain_id}:${ZKCENTER_NAME} (${byte32ZkCenterName}) = ${deployed_info.proxyAddress}`)
  const contractAddressManagerSigner = contractAddressManager.connect(signer);
  const txn = await contractAddressManagerSigner.getFunction('setAddress')
    .send(chain_id, byte32ZkCenterName, deployed_info.proxyAddress);
  console.log(`resp: ${JSON.stringify(txn)}`);

  // Try resolve ZkCenter via TaikoL1
  const addr = (await contractTaikoL1.getFunction('resolve').staticCallResult(byte32ZkCenterName, true))
    .toArray()[0];
  console.log(`Resolved address: ${addr}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
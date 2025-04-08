import './extension';

const {ethers, upgrades} = require('hardhat');
import hre from 'hardhat';
import {getImplementationAddress} from '@openzeppelin/upgrades-core';

import {ERC6551Registry, SgxMinerTokenUpgradeable, ERC6551Account, ZkCenterUpgradeable,} from '../typechain-types';
import {ContractTransactionReceipt} from 'ethers';

//==========================================================================
// contracts
//==========================================================================
let gContractERC6551Registry: ERC6551Registry|undefined;
let gContractERC6551Account: ERC6551Account|undefined;
let gProxySgxMinerToken: SgxMinerTokenUpgradeable|undefined;
let gProxyZkCenter: ZkCenterUpgradeable|undefined;

//==========================================================================
//==========================================================================
async function deployToHardhat() {
  if (hre.network.name != 'hardhat') {
    return;
  }
  console.log('Deploy contract to hardhat.');

  // Deploy
  const factoryERC6551Registry = await ethers.getContractFactory('ERC6551Registry');
  const contractERC6551Registry = await factoryERC6551Registry.deploy();
  await contractERC6551Registry.waitForDeployment();
  const addressERC6551Registry = await contractERC6551Registry.getAddress();
  console.log(`ERC6551Registry deployed. Address: ${addressERC6551Registry}.`);
  gContractERC6551Registry = contractERC6551Registry;

  const factoryERC6551Account = await ethers.getContractFactory('ERC6551Account');
  const contractERC6551Account = await factoryERC6551Account.deploy();
  await contractERC6551Account.waitForDeployment();
  const addressERC6551Account = await contractERC6551Account.getAddress();
  console.log(`ERC6551Account deployed. Address: ${addressERC6551Account}.`);
  gContractERC6551Account = contractERC6551Account;

  // const factoryERC6551AccountProxy = await ethers.getContractFactory('CommonProxy');
  // const contractERC6551AccountProxy = await factoryERC6551AccountProxy.deploy(addressERC6551AccountUpgradeable) as
  // ERC6551AccountUpgradeable; await contractERC6551AccountProxy.waitForDeployment(); const addressERC6551AccountProxy = await
  // contractERC6551AccountProxy.getAddress(); console.log(`ERC6551Account Proxy deployed. Address:
  // ${addressERC6551AccountProxy}.`); gProxyERC6551Account = contractERC6551AccountProxy;

  // const factorySgxMinerTokenUpgradeable = await ethers.getContractFactory('SgxMinerTokenUpgradeable');
  // const contractSgxMinerTokenUpgradeable = await factorySgxMinerTokenUpgradeable.deploy();
  // await contractSgxMinerTokenUpgradeable.waitForDeployment();
  // const addressSgxMinerTokenUpgradeable = await contractSgxMinerTokenUpgradeable.getAddress();
  // console.log(`SgxMinerTokenUpgradeable deployed. Address: ${addressSgxMinerTokenUpgradeable}.`);

  // const factorySgxMinerTokenProxy = await ethers.getContractFactory('CommonProxy');
  // const contractSgxMinerTokenProxy = await factorySgxMinerTokenProxy.deploy(addressSgxMinerTokenUpgradeable) as
  // SgxMinerTokenUpgradeable; await contractSgxMinerTokenProxy.waitForDeployment(); const addressSgxMinerTokenProxy = await
  // contractSgxMinerTokenProxy.getAddress(); console.log(`SgxMinerToken Proxy deployed. Address: ${addressSgxMinerTokenProxy}.`);
  // gProxySgxMinerToken = contractSgxMinerTokenProxy;


  // const factoryZkCenterUpgradeable = await ethers.getContractFactory('ZkCenterUpgradeable');
  // const contractZkCenterUpgradeable = await factoryZkCenterUpgradeable.deploy();
  // await contractZkCenterUpgradeable.waitForDeployment();
  // const addressZkCenterUpgradeable = await contractZkCenterUpgradeable.getAddress();
  // console.log(`ZkCenterUpgradeable deployed. Address: ${addressZkCenterUpgradeable}.`);

  // const factoryZkCenterProxy = await ethers.getContractFactory('CommonProxy');
  // const contractZkCenterProxy = await factoryZkCenterProxy.deploy(addressZkCenterUpgradeable);
  // await contractZkCenterProxy.waitForDeployment();
  // const addressZkCenterProxy = await contractZkCenterProxy.getAddress();
  // console.log(`ZkCenter Proxy deployed. Address: ${addressZkCenterProxy}.`);
  // gProxyZkCenter = contractZkCenterProxy;


  // const factoryERC6551AccountUpgradeable = await ethers.getContractFactory('ERC6551AccountUpgradeable');
  // const proxyERC6551Account =
  //     await upgrades.deployProxy(factoryERC6551AccountUpgradeable, [], {timeout: (5 * 60 * 1000)}) as ERC6551AccountUpgradeable;
  // await proxyERC6551Account.waitForDeployment();
  // const addressERC6551Account = await proxyERC6551Account.getAddress();
  // const addressImpERC6551Account = await getImplementationAddress(ethers.provider, addressERC6551Account);
  // console.log(`ERC6551AccountUpgradeable deployed. Proxy: ${addressERC6551Account}. Implemenataion: ${addressImpERC6551Account}`);
  // gProxyERC6551Account = proxyERC6551Account;


  const factorySgxMinerTokenUpgradeable = await ethers.getContractFactory('SgxMinerTokenUpgradeable');
  const proxySgxMinerToken =
      await upgrades.deployProxy(factorySgxMinerTokenUpgradeable, ['SgxMinerToken', 'SgxMinerToken'], {timeout: (5 * 60 * 1000)}) as
      SgxMinerTokenUpgradeable;
  await proxySgxMinerToken.waitForDeployment();
  const addressSgxMinerToken = await proxySgxMinerToken.getAddress();
  const addressImpSgxMinerToken = await getImplementationAddress(ethers.provider, addressSgxMinerToken);
  console.log(`SgxMinerTokenUpgradeable deployed. Proxy: ${addressSgxMinerToken}. Implemenataion: ${addressImpSgxMinerToken}`);
  gProxySgxMinerToken = proxySgxMinerToken;

  //
  const factoryZkCenterUpgradeable = await ethers.getContractFactory('ZkCenterUpgradeable');
  const proxyZkCenterUpgradeable =
      await upgrades.deployProxy(
          factoryZkCenterUpgradeable, [addressERC6551Registry, addressERC6551Account, addressSgxMinerToken],
          {timeout: (5 * 60 * 1000)}) as ZkCenterUpgradeable;
  await proxyZkCenterUpgradeable.waitForDeployment();
  const addressZkCenter = await proxyZkCenterUpgradeable.getAddress();
  const addressImpZkCenter = await getImplementationAddress(ethers.provider, addressZkCenter);
  console.log(`ZkCenterUpgradeable deployed. Proxy: ${addressZkCenter}. Implemenataion: ${addressImpZkCenter}`);
  gProxyZkCenter = proxyZkCenterUpgradeable;
}

//==========================================================================
//==========================================================================
function ShowReceiptEvents(aContract: any, aReceipt: ContractTransactionReceipt|null, aPrefix: string) {
  if (!aContract || !aReceipt) {
  } else if (aReceipt.logs.length == 0) {
    console.log(`${aPrefix}Log is empty.`);
  } else {
    for (let i = 0; i < aReceipt.logs.length; i++) {
      const log = aReceipt.logs[i];
      if (log) {
        const decoded_log = aContract.interface.parseLog(log);
        if ((decoded_log) && (Object.hasOwn(decoded_log, 'fragment')) && (decoded_log.fragment.type == 'event')) {
          console.log(`${aPrefix}Event '${decoded_log.name}', ${decoded_log.args}`);
        }
      }
    }
  }
}

//==========================================================================
//==========================================================================
async function testNft() {
  const salt = ethers.encodeBytes32String('moonchain', false);
  const sgx_instance_id = 10;
  const addressERC6551Account = await gContractERC6551Account!.getAddress();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const addressSgxMinerToken = await gProxySgxMinerToken!.getAddress();
  const addressZkCenter = await gProxyZkCenter!.getAddress();

  // Mint a SgxMinerToken
  console.log(`Mint NFT ${sgx_instance_id}`);
  const mintResp = await gProxySgxMinerToken!.mint(sgx_instance_id);
  const mintReceipt = await mintResp?.wait();
  ShowReceiptEvents(gProxySgxMinerToken, mintReceipt, '  ');
  console.log(' ');

  // Create Account
  console.log(`Create ERC6551 account.`);
  const createResp =
      await gContractERC6551Registry!.createAccount(addressERC6551Account, salt, chainId, addressSgxMinerToken, sgx_instance_id);
  const createReceipt = await createResp?.wait();
  ShowReceiptEvents(gContractERC6551Registry, createReceipt, '  ');
  const acc = await gContractERC6551Registry!.account(addressERC6551Account, salt, chainId, addressSgxMinerToken, sgx_instance_id);
  console.log(`  acc: ${acc}`);
  console.log(' ');

  console.log(`Create again.`);
  const createResp2 =
      await gContractERC6551Registry!.createAccount(addressERC6551Account, salt, chainId, addressSgxMinerToken, sgx_instance_id);
  const createReceipt2 = await createResp2?.wait();
  ShowReceiptEvents(gContractERC6551Registry, createReceipt2, '  ');
  console.log(' ');

  //
  console.log(`Try ZkCenter.`);
  const ret1 = await gProxyZkCenter!.testAccByInstanceId(sgx_instance_id);
  console.log(`  testAccByInstanceId: ${JSON.stringify(ret1)}`);

  const ret2 = await gProxyZkCenter!.testAcc(acc);
  console.log(`  testAcc2: ${ret2}`);

  const ret3 = await gProxyZkCenter!.showCaller(sgx_instance_id);
  console.log(`  showCaller: ${ret3}`);

  const total_supply1 = await gProxySgxMinerToken!.totalSupply();
  console.log(`  total_supply (direct): ${total_supply1}`);
  const total_supply2 = await gProxyZkCenter!.totalSupply();
  console.log(`  total_supply (ZkCenter): ${total_supply2}`);

  console.log(' ');

  //
  console.log(`Try execute()`);
  const factoryERC6551Account = await ethers.getContractFactory("ERC6551Account");
  let contractAccount = factoryERC6551Account.attach(acc) as ERC6551Account;

  const call_data = gProxyZkCenter?.interface.encodeFunctionData('showCaller',[sgx_instance_id]);
  console.log(`  call_data: ${call_data}`);
  const execResp = await contractAccount.execute(addressZkCenter, 0,  ethers.getBytes(call_data), 0);
  const execReceipt = await execResp.wait();
  ShowReceiptEvents(gProxyZkCenter, execReceipt, '  ');
  console.log(' ');

}


//==========================================================================
// The entry
//==========================================================================
async function main() {
  //
  console.log(`ethers: ${ethers.version}`);
  console.log(`Network: ${hre.network.name}`)

  //
  const [signer] = await ethers.getSigners();
  console.log(`signer: ${signer.address}`);

  //
  console.log(`Current Block: ${await ethers.provider.getBlockNumber()}`);
  console.log(' ');

  //
  if (hre.network.name == 'hardhat') {
    await deployToHardhat();
  } else {
    throw `${hre.network.name} not support yet.`
  }
  console.log(' ');

  //
  if (!gContractERC6551Registry) {
    throw 'gContractERC6551Registry not ready.';
  }
  if (!gContractERC6551Account) {
    throw 'gContractERC6551Account not ready.';
  }
  if (!gProxySgxMinerToken) {
    throw 'gProxySgxMinerToken not ready.';
  }
  if (!gProxyZkCenter) {
    throw 'gProxyZkCenter not ready.';
  }
  //
  await testNft();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
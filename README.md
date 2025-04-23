# ZkCenter

This repository contains the administration contract for the mining and staking processes on Moonchain. For a deeper understanding of the design concept, please refer to the [Moonchain ZK Lite Paper](https://doc.moonchain.com/docs/Moonchain-Design/zk).



## Tested development environment

- Ubuntu 22.04

- nodejs v20.18.1

- npm 10.8.2

- yarn 1.22.22



## Actions

After clone the repos, run this once to install the npm packages.

```
yarn
```



Compile the contract.

```
yarn compile
```



Clean all output files.

```
yarn clean
```



Test on local with harthat.
```
yarn test
```



## Deployment

Set private key of the deployer.

```
export PRIVATE_KEY=<KEY>
```

Set the arbiscan API key

```
export ETHERSCAN_API_KEY=<API_KEY>
```



Run the script to deploy.

```
npx hardhat --network arbitrum_sepolia run deploy/deploy_zkcenter.ts
```

The deployment process checks against a JSON file named after the network. During the initial deployment, this JSON file is created. For subsequent runs, the script compares the `name2()` value of the contract with the corresponding `expectedName2` field in the JSON file. If they do not match, a contract upgrade will be triggered. Therefore, when updating a contract, make sure to update both the return value of `name2()` and the `expectedName2` field in the JSON file. This ensures the deployment script can handle the process correctly.



Verify the deployed contract.

```
npx hardhat verify --network arbitrum_sepolia <CONTRACT ADDRESS>
```



Update the new address to TaikoL1 if needed.

```
env PRIVATE_KEY=<OWNER_ADDRESS> npx hardhat --network arbitrum_sepolia run deploy/set_zkcenter_to_taikol1.ts
```



Set controller.

```
env CONTROLLER_ADDRESS=<ADDRESS> npx hardhat --network arbitrum_sepolia run deploy/set_zkcenter_controller.ts 
```


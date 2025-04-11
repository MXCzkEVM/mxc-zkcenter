import { HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import '@openzeppelin/hardhat-upgrades';

const blankAddress = "0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    },
    version: "0.8.27",
  },
  networks: {
    mxc_mainnet: {
      url: 'https://rpc.mxc.com',
      chainId: 18686,
      accounts: [process.env.PRIVATE_KEY || blankAddress],
    },
    mxc_testnet: {
      url:
          process.env.MXC_TESTNET_URL || 'https://geneva-rpc.moonchain.com',
      chainId: 5167004,
      accounts: [process.env.PRIVATE_KEY || blankAddress],
    },
    arbitrum_sepolia: {
      url:
          process.env.MXC_TESTNET_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
      chainId: 421614,
      accounts: [process.env.PRIVATE_KEY || blankAddress],
    },
    holesky: {
      url:
          process.env.MXC_TESTNET_URL || 'https://ethereum-holesky-rpc.publicnode.com',
      chainId: 17000,
      accounts: [process.env.PRIVATE_KEY || blankAddress],
    },
    ethereum: {
      url:
          process.env.MXC_TESTNET_URL || 'https://ethereum-rpc.publicnode.com',
      chainId: 1,
      accounts: [process.env.PRIVATE_KEY || blankAddress],
    },

  },
  sourcify: {
    enabled: false
  },  
  etherscan: {
    apiKey: {
      geneva: process.env.ETHERSCAN_API_KEY || "X",
      arbitrum_sepolia: process.env.ETHERSCAN_API_KEY || "X"
    },
    customChains: [
      {
        network: "mxc_testnet",
        chainId: 5167004,
        urls: {
          apiURL: "https://geneva-explorer-v1.moonchain.com/api",
          browserURL: "https://geneva-explorer-v1.moonchain.com"
        }
      },
      {
        network: "arbitrum_sepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io"
        }
      },
    ]
  }
};

export default config;

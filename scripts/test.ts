import {ethers} from 'hardhat';

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
  console.log(`Current Block: ${await ethers.provider.getBlockNumber()}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
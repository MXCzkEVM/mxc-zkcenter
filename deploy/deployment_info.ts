import {ethers} from 'hardhat';
import hre from 'hardhat';
import fs from 'node:fs';

import {BlankDeploymentInfo, ContractInfoParse, DeploymentList, ContractInfo} from '../typia/output/deployment_list';

//==========================================================================
//==========================================================================
class DeploymentInfo {
  public list: DeploymentList;

  constructor() {
    this.list = BlankDeploymentInfo();
  }

  public filePath(): string {
    return `./deploy/${hre.network.name}.json`;
  }

  public async load() {
    const path = this.filePath();
    if (fs.existsSync(path)) {
      const content = fs.readFileSync(path).toString();
      this.list = ContractInfoParse(content);
    } else {
      const chain_id = (await ethers.provider.getNetwork()).chainId;
      console.log(`chain_id=${chain_id}`);
      this.list = BlankDeploymentInfo();
      this.list.network = hre.network.name;
      this.list.chainId = chain_id.toString();
    }
  }

  public save() {
    const path = this.filePath();
    const content = JSON.stringify(this.list, null, 2);
    fs.writeFileSync(path, content);
  }

  public setContractInfo(aInfo: ContractInfo) {
    let found = false;
    for (let i = 0; i < this.list.contractList.length; i ++) {
      if (this.list.contractList[i].contractFactoryName == aInfo.contractFactoryName) {
        // Find existing contract, replace
        this.list.contractList[i] = aInfo;
        found = true;
        break;
      }
    }
    if (!found) {
      // No found, create
      this.list.contractList.push(aInfo);
    }
  }

  public getContractInfo(aFactoryName: string): ContractInfo | undefined {
    for (let i = 0; i < this.list.contractList.length; i ++) {
      if (this.list.contractList[i].contractFactoryName == aFactoryName) {
        return this.list.contractList[i];
      }
    }
    return undefined;
  }
}


//==========================================================================
//==========================================================================
export {
  DeploymentInfo,
};
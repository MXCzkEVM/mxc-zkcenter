import typia, {tags} from 'typia';

//==========================================================================
// Responses
//==========================================================================
export const ContractInfoSchema = typia.json.application<[DeploymentList], '3.0'>();

export interface ContractInfo {
  deployer: string,
  contractFactoryName: string,
  contractName2: string,
  timeUpdated: String,
  proxyAddress: string,
  impAddress: string,
  expectedName2: string,
}

export interface DeploymentList {
  network: string,
  chainId: string,
  contractList: ContractInfo[],
}

export function BlankDeploymentInfo(): DeploymentList {
  return {
    network: '',
    chainId: '',
    contractList: [],
  };
}

export function ContractInfoParse(aInput: string): DeploymentList {
  let parsed: DeploymentList = typia.json.assertParse<DeploymentList>(aInput);
  return parsed;
}
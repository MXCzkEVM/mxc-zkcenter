import typia, { tags } from 'typia';
//==========================================================================
// Responses
//==========================================================================
export const ContractInfoSchema = {
    version: "3.0",
    components: {
        schemas: {
            DeploymentList: {
                type: "object",
                properties: {
                    network: {
                        type: "string"
                    },
                    chainId: {
                        type: "string"
                    },
                    contractList: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/ContractInfo"
                        }
                    }
                },
                nullable: false,
                required: [
                    "network",
                    "chainId",
                    "contractList"
                ]
            },
            ContractInfo: {
                type: "object",
                properties: {
                    deployer: {
                        type: "string"
                    },
                    contractFactoryName: {
                        type: "string"
                    },
                    contractName2: {
                        type: "string"
                    },
                    timeUpdated: {
                        type: "string"
                    },
                    proxyAddress: {
                        type: "string"
                    },
                    impAddress: {
                        type: "string"
                    },
                    expectedName2: {
                        type: "string"
                    }
                },
                nullable: false,
                required: [
                    "deployer",
                    "contractFactoryName",
                    "contractName2",
                    "timeUpdated",
                    "proxyAddress",
                    "impAddress",
                    "expectedName2"
                ]
            }
        }
    },
    schemas: [
        {
            $ref: "#/components/schemas/DeploymentList"
        }
    ]
};
export interface ContractInfo {
    deployer: string;
    contractFactoryName: string;
    contractName2: string;
    timeUpdated: String;
    proxyAddress: string;
    impAddress: string;
    expectedName2: string;
}
export interface DeploymentList {
    network: string;
    chainId: string;
    contractList: ContractInfo[];
}
export function BlankDeploymentInfo(): DeploymentList {
    return {
        network: '',
        chainId: '',
        contractList: [],
    };
}
export function ContractInfoParse(aInput: string): DeploymentList {
    let parsed: DeploymentList = (() => { const $guard = (typia.json.assertParse as any).guard; const $io0 = (input: any): boolean => "string" === typeof input.network && "string" === typeof input.chainId && (Array.isArray(input.contractList) && input.contractList.every((elem: any) => "object" === typeof elem && null !== elem && $io1(elem))); const $io1 = (input: any): boolean => "string" === typeof input.deployer && "string" === typeof input.contractFactoryName && "string" === typeof input.contractName2 && ("string" === typeof input.timeUpdated || input.timeUpdated instanceof String) && "string" === typeof input.proxyAddress && "string" === typeof input.impAddress && "string" === typeof input.expectedName2; const $ao0 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("string" === typeof input.network || $guard(_exceptionable, {
        path: _path + ".network",
        expected: "string",
        value: input.network
    }, _errorFactory)) && ("string" === typeof input.chainId || $guard(_exceptionable, {
        path: _path + ".chainId",
        expected: "string",
        value: input.chainId
    }, _errorFactory)) && ((Array.isArray(input.contractList) || $guard(_exceptionable, {
        path: _path + ".contractList",
        expected: "Array<ContractInfo>",
        value: input.contractList
    }, _errorFactory)) && input.contractList.every((elem: any, _index2: number) => ("object" === typeof elem && null !== elem || $guard(_exceptionable, {
        path: _path + ".contractList[" + _index2 + "]",
        expected: "ContractInfo",
        value: elem
    }, _errorFactory)) && $ao1(elem, _path + ".contractList[" + _index2 + "]", true && _exceptionable) || $guard(_exceptionable, {
        path: _path + ".contractList[" + _index2 + "]",
        expected: "ContractInfo",
        value: elem
    }, _errorFactory)) || $guard(_exceptionable, {
        path: _path + ".contractList",
        expected: "Array<ContractInfo>",
        value: input.contractList
    }, _errorFactory)); const $ao1 = (input: any, _path: string, _exceptionable: boolean = true): boolean => ("string" === typeof input.deployer || $guard(_exceptionable, {
        path: _path + ".deployer",
        expected: "string",
        value: input.deployer
    }, _errorFactory)) && ("string" === typeof input.contractFactoryName || $guard(_exceptionable, {
        path: _path + ".contractFactoryName",
        expected: "string",
        value: input.contractFactoryName
    }, _errorFactory)) && ("string" === typeof input.contractName2 || $guard(_exceptionable, {
        path: _path + ".contractName2",
        expected: "string",
        value: input.contractName2
    }, _errorFactory)) && ("string" === typeof input.timeUpdated || input.timeUpdated instanceof String || $guard(_exceptionable, {
        path: _path + ".timeUpdated",
        expected: "String",
        value: input.timeUpdated
    }, _errorFactory)) && ("string" === typeof input.proxyAddress || $guard(_exceptionable, {
        path: _path + ".proxyAddress",
        expected: "string",
        value: input.proxyAddress
    }, _errorFactory)) && ("string" === typeof input.impAddress || $guard(_exceptionable, {
        path: _path + ".impAddress",
        expected: "string",
        value: input.impAddress
    }, _errorFactory)) && ("string" === typeof input.expectedName2 || $guard(_exceptionable, {
        path: _path + ".expectedName2",
        expected: "string",
        value: input.expectedName2
    }, _errorFactory)); const __is = (input: any): input is DeploymentList => "object" === typeof input && null !== input && $io0(input); let _errorFactory: any; const __assert = (input: any, errorFactory?: (p: import("typia").TypeGuardError.IProps) => Error): DeploymentList => {
        if (false === __is(input)) {
            _errorFactory = errorFactory;
            ((input: any, _path: string, _exceptionable: boolean = true) => ("object" === typeof input && null !== input || $guard(true, {
                path: _path + "",
                expected: "DeploymentList",
                value: input
            }, _errorFactory)) && $ao0(input, _path + "", true) || $guard(true, {
                path: _path + "",
                expected: "DeploymentList",
                value: input
            }, _errorFactory))(input, "$input", true);
        }
        return input;
    }; return (input: string, errorFactory?: (p: import("typia").TypeGuardError.IProps) => Error): import("typia").Primitive<DeploymentList> => __assert(JSON.parse(input), errorFactory); })()(aInput);
    return parsed;
}

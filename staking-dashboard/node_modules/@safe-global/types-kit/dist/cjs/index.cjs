"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  OperationType: () => OperationType,
  SafeWebAuthnSharedSigner_0_2_1_ContractArtifacts: () => safe_webauthn_shared_signer_default,
  SafeWebAuthnSignerFactory_0_2_1_ContractArtifacts: () => safe_webauthn_signer_factory_default,
  SignatureTypes: () => SignatureTypes,
  SigningMethod: () => SigningMethod,
  compatibilityFallbackHandler_1_3_0_ContractArtifacts: () => compatibility_fallback_handler_default,
  compatibilityFallbackHandler_1_4_1_ContractArtifacts: () => compatibility_fallback_handler_default2,
  createCall_1_3_0_ContractArtifacts: () => create_call_default,
  createCall_1_4_1_ContractArtifacts: () => create_call_default2,
  multiSendCallOnly_1_3_0_ContractArtifacts: () => multi_send_call_only_default,
  multiSendCallOnly_1_4_1_ContractArtifacts: () => multi_send_call_only_default2,
  multisend_1_1_1_ContractArtifacts: () => multi_send_default,
  multisend_1_3_0_ContractArtifacts: () => multi_send_default2,
  multisend_1_4_1_ContractArtifacts: () => multi_send_default3,
  safeProxyFactory_1_0_0_ContractArtifacts: () => proxy_factory_default,
  safeProxyFactory_1_1_1_ContractArtifacts: () => proxy_factory_default2,
  safeProxyFactory_1_3_0_ContractArtifacts: () => proxy_factory_default3,
  safeProxyFactory_1_4_1_ContractArtifacts: () => safe_proxy_factory_default,
  safe_1_0_0_ContractArtifacts: () => gnosis_safe_default,
  safe_1_1_1_ContractArtifacts: () => gnosis_safe_default2,
  safe_1_2_0_ContractArtifacts: () => gnosis_safe_default3,
  safe_1_3_0_ContractArtifacts: () => gnosis_safe_l2_default,
  safe_1_4_1_ContractArtifacts: () => safe_l2_default,
  signMessageLib_1_3_0_ContractArtifacts: () => sign_message_lib_default,
  signMessageLib_1_4_1_ContractArtifacts: () => sign_message_lib_default2,
  simulateTxAccessor_1_3_0_ContractArtifacts: () => simulate_tx_accessor_default,
  simulateTxAccessor_1_4_1_ContractArtifacts: () => simulate_tx_accessor_default2
});
module.exports = __toCommonJS(index_exports);

// src/contracts/CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandlerContract_v1_3_0.ts
var import_abitype = require("abitype");

// src/contracts/assets/CompatibilityFallbackHandler/v1.3.0/compatibility_fallback_handler.ts
var compatibility_fallback_handler_default = {
  contractName: "CompatibilityFallbackHandler",
  version: "1.3.0",
  abi: [
    {
      inputs: [],
      name: "NAME",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "VERSION",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "message",
          type: "bytes"
        }
      ],
      name: "getMessageHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "contract GnosisSafe",
          name: "safe",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "message",
          type: "bytes"
        }
      ],
      name: "getMessageHashForSafe",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "getModules",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "_dataHash",
          type: "bytes32"
        },
        {
          internalType: "bytes",
          name: "_signature",
          type: "bytes"
        }
      ],
      name: "isValidSignature",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "_data",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "_signature",
          type: "bytes"
        }
      ],
      name: "isValidSignature",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]"
        },
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]"
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      name: "onERC1155BatchReceived",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      stateMutability: "pure",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      name: "onERC1155Received",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      stateMutability: "pure",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      name: "onERC721Received",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      stateMutability: "pure",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "targetContract",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "calldataPayload",
          type: "bytes"
        }
      ],
      name: "simulate",
      outputs: [
        {
          internalType: "bytes",
          name: "response",
          type: "bytes"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes4",
          name: "interfaceId",
          type: "bytes4"
        }
      ],
      name: "supportsInterface",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      name: "tokensReceived",
      outputs: [],
      stateMutability: "pure",
      type: "function"
    }
  ]
};

// src/contracts/CompatibilityFallbackHandler/v1.3.0/CompatibilityFallbackHandlerContract_v1_3_0.ts
var compatibilityFallbackHandlerContract_v1_3_0_AbiTypes = (0, import_abitype.narrow)(
  compatibility_fallback_handler_default.abi
);

// src/contracts/CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandlerContract_v1_4_1.ts
var import_abitype2 = require("abitype");

// src/contracts/assets/CompatibilityFallbackHandler/v1.4.1/compatibility_fallback_handler.ts
var compatibility_fallback_handler_default2 = {
  contractName: "CompatibilityFallbackHandler",
  version: "1.4.1",
  abi: [
    {
      inputs: [
        {
          internalType: "contract Safe",
          name: "safe",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "message",
          type: "bytes"
        }
      ],
      name: "encodeMessageDataForSafe",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "message",
          type: "bytes"
        }
      ],
      name: "getMessageHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "contract Safe",
          name: "safe",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "message",
          type: "bytes"
        }
      ],
      name: "getMessageHashForSafe",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "getModules",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "_dataHash",
          type: "bytes32"
        },
        {
          internalType: "bytes",
          name: "_signature",
          type: "bytes"
        }
      ],
      name: "isValidSignature",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "_data",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "_signature",
          type: "bytes"
        }
      ],
      name: "isValidSignature",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]"
        },
        {
          internalType: "uint256[]",
          name: "",
          type: "uint256[]"
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      name: "onERC1155BatchReceived",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      stateMutability: "pure",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      name: "onERC1155Received",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      stateMutability: "pure",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      name: "onERC721Received",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      stateMutability: "pure",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "targetContract",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "calldataPayload",
          type: "bytes"
        }
      ],
      name: "simulate",
      outputs: [
        {
          internalType: "bytes",
          name: "response",
          type: "bytes"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes4",
          name: "interfaceId",
          type: "bytes4"
        }
      ],
      name: "supportsInterface",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      name: "tokensReceived",
      outputs: [],
      stateMutability: "pure",
      type: "function"
    }
  ]
};

// src/contracts/CompatibilityFallbackHandler/v1.4.1/CompatibilityFallbackHandlerContract_v1_4_1.ts
var compatibilityFallbackHandlerContract_v1_4_1_AbiTypes = (0, import_abitype2.narrow)(
  compatibility_fallback_handler_default2.abi
);

// src/contracts/MultiSend/v1.1.1/MultiSendContract_v1_1_1.ts
var import_abitype3 = require("abitype");

// src/contracts/assets/MultiSend/v1.1.1/multi_send.ts
var multi_send_default = {
  contractName: "MultiSend",
  version: "1.1.1",
  abi: [
    {
      inputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "bytes",
          name: "transactions",
          type: "bytes"
        }
      ],
      name: "multiSend",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    }
  ]
};

// src/contracts/MultiSend/v1.1.1/MultiSendContract_v1_1_1.ts
var multiSendContract_v1_1_1_AbiTypes = (0, import_abitype3.narrow)(multi_send_default.abi);

// src/contracts/MultiSend/v1.3.0/MultiSendContract_v1_3_0.ts
var import_abitype4 = require("abitype");

// src/contracts/assets/MultiSend/v1.3.0/multi_send.ts
var multi_send_default2 = {
  contractName: "MultiSend",
  version: "1.3.0",
  abi: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "transactions",
          type: "bytes"
        }
      ],
      name: "multiSend",
      outputs: [],
      stateMutability: "payable",
      type: "function"
    }
  ]
};

// src/contracts/MultiSend/v1.3.0/MultiSendContract_v1_3_0.ts
var multiSendContract_v1_3_0_AbiTypes = (0, import_abitype4.narrow)(multi_send_default2.abi);

// src/contracts/MultiSend/v1.4.1/MultiSendContract_v1_4_1.ts
var import_abitype5 = require("abitype");

// src/contracts/assets/MultiSend/v1.4.1/multi_send.ts
var multi_send_default3 = {
  contractName: "MultiSend",
  version: "1.4.1",
  abi: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "transactions",
          type: "bytes"
        }
      ],
      name: "multiSend",
      outputs: [],
      stateMutability: "payable",
      type: "function"
    }
  ]
};

// src/contracts/MultiSend/v1.4.1/MultiSendContract_v1_4_1.ts
var multiSendContract_v1_4_1_AbiTypes = (0, import_abitype5.narrow)(multi_send_default3.abi);

// src/contracts/MultiSend/v1.3.0/MultiSendCallOnlyContract_v1_3_0.ts
var import_abitype6 = require("abitype");

// src/contracts/assets/MultiSend/v1.3.0/multi_send_call_only.ts
var multi_send_call_only_default = {
  contractName: "MultiSendCallOnly",
  version: "1.3.0",
  abi: [
    {
      inputs: [
        {
          internalType: "bytes",
          name: "transactions",
          type: "bytes"
        }
      ],
      name: "multiSend",
      outputs: [],
      stateMutability: "payable",
      type: "function"
    }
  ]
};

// src/contracts/MultiSend/v1.3.0/MultiSendCallOnlyContract_v1_3_0.ts
var multiSendCallOnlyContract_v1_3_0_AbiTypes = (0, import_abitype6.narrow)(
  multi_send_call_only_default.abi
);

// src/contracts/MultiSend/v1.4.1/MultiSendCallOnlyContract_v1_4_1.ts
var import_abitype7 = require("abitype");

// src/contracts/assets/MultiSend/v1.4.1/multi_send_call_only.ts
var multi_send_call_only_default2 = {
  contractName: "MultiSendCallOnly",
  version: "1.4.1",
  abi: [
    {
      inputs: [
        {
          internalType: "bytes",
          name: "transactions",
          type: "bytes"
        }
      ],
      name: "multiSend",
      outputs: [],
      stateMutability: "payable",
      type: "function"
    }
  ]
};

// src/contracts/MultiSend/v1.4.1/MultiSendCallOnlyContract_v1_4_1.ts
var multiSendCallOnlyContract_v1_4_1_AbiTypes = (0, import_abitype7.narrow)(
  multi_send_call_only_default2.abi
);

// src/contracts/CreateCall/v1.3.0/CreateCallContract_v1_3_0.ts
var import_abitype8 = require("abitype");

// src/contracts/assets/CreateCall/v1.3.0/create_call.ts
var create_call_default = {
  contractName: "CreateCall",
  version: "1.3.0",
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "newContract",
          type: "address"
        }
      ],
      name: "ContractCreation",
      type: "event"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "deploymentData",
          type: "bytes"
        }
      ],
      name: "performCreate",
      outputs: [
        {
          internalType: "address",
          name: "newContract",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "deploymentData",
          type: "bytes"
        },
        {
          internalType: "bytes32",
          name: "salt",
          type: "bytes32"
        }
      ],
      name: "performCreate2",
      outputs: [
        {
          internalType: "address",
          name: "newContract",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    }
  ]
};

// src/contracts/CreateCall/v1.3.0/CreateCallContract_v1_3_0.ts
var createCallContract_v1_3_0_AbiTypes = (0, import_abitype8.narrow)(create_call_default.abi);

// src/contracts/CreateCall/v1.4.1/CreateCallContract_v1_4_1.ts
var import_abitype9 = require("abitype");

// src/contracts/assets/CreateCall/v1.4.1/create_call.ts
var create_call_default2 = {
  contractName: "CreateCall",
  version: "1.4.1",
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "newContract",
          type: "address"
        }
      ],
      name: "ContractCreation",
      type: "event"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "deploymentData",
          type: "bytes"
        }
      ],
      name: "performCreate",
      outputs: [
        {
          internalType: "address",
          name: "newContract",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "deploymentData",
          type: "bytes"
        },
        {
          internalType: "bytes32",
          name: "salt",
          type: "bytes32"
        }
      ],
      name: "performCreate2",
      outputs: [
        {
          internalType: "address",
          name: "newContract",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    }
  ]
};

// src/contracts/CreateCall/v1.4.1/CreateCallContract_v1_4_1.ts
var createCallContract_v1_4_1_AbiTypes = (0, import_abitype9.narrow)(create_call_default2.abi);

// src/contracts/Safe/v1.0.0/SafeContract_v1_0_0.ts
var import_abitype10 = require("abitype");

// src/contracts/assets/Safe/v1.0.0/gnosis_safe.ts
var gnosis_safe_default = {
  contractName: "GnosisSafe",
  version: "1.0.0",
  abi: [
    {
      constant: false,
      inputs: [
        { name: "owner", type: "address" },
        { name: "_threshold", type: "uint256" }
      ],
      name: "addOwnerWithThreshold",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "DOMAIN_SEPARATOR_TYPEHASH",
      outputs: [{ name: "", type: "bytes32" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [{ name: "owner", type: "address" }],
      name: "isOwner",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "operation", type: "uint8" }
      ],
      name: "execTransactionFromModule",
      outputs: [{ name: "success", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [{ name: "", type: "bytes32" }],
      name: "signedMessages",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [{ name: "module", type: "address" }],
      name: "enableModule",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [{ name: "_threshold", type: "uint256" }],
      name: "changeThreshold",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        { name: "", type: "address" },
        { name: "", type: "bytes32" }
      ],
      name: "approvedHashes",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [{ name: "_masterCopy", type: "address" }],
      name: "changeMasterCopy",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "SENTINEL_MODULES",
      outputs: [{ name: "", type: "address" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "SENTINEL_OWNERS",
      outputs: [{ name: "", type: "address" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "getOwners",
      outputs: [{ name: "", type: "address[]" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "NAME",
      outputs: [{ name: "", type: "string" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "nonce",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "getModules",
      outputs: [{ name: "", type: "address[]" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "SAFE_MSG_TYPEHASH",
      outputs: [{ name: "", type: "bytes32" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "SAFE_TX_TYPEHASH",
      outputs: [{ name: "", type: "bytes32" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        { name: "prevModule", type: "address" },
        { name: "module", type: "address" }
      ],
      name: "disableModule",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        { name: "prevOwner", type: "address" },
        { name: "oldOwner", type: "address" },
        { name: "newOwner", type: "address" }
      ],
      name: "swapOwner",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "getThreshold",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "domainSeparator",
      outputs: [{ name: "", type: "bytes32" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        { name: "prevOwner", type: "address" },
        { name: "owner", type: "address" },
        { name: "_threshold", type: "uint256" }
      ],
      name: "removeOwner",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "VERSION",
      outputs: [{ name: "", type: "string" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    { payable: true, stateMutability: "payable", type: "fallback" },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "txHash", type: "bytes32" }],
      name: "ExecutionFailed",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "owner", type: "address" }],
      name: "AddedOwner",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "owner", type: "address" }],
      name: "RemovedOwner",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "threshold", type: "uint256" }],
      name: "ChangedThreshold",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "module", type: "address" }],
      name: "EnabledModule",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "module", type: "address" }],
      name: "DisabledModule",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: "newContract", type: "address" }],
      name: "ContractCreation",
      type: "event"
    },
    {
      constant: false,
      inputs: [
        { name: "_owners", type: "address[]" },
        { name: "_threshold", type: "uint256" },
        { name: "to", type: "address" },
        { name: "data", type: "bytes" },
        { name: "paymentToken", type: "address" },
        { name: "payment", type: "uint256" },
        { name: "paymentReceiver", type: "address" }
      ],
      name: "setup",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "operation", type: "uint8" },
        { name: "safeTxGas", type: "uint256" },
        { name: "baseGas", type: "uint256" },
        { name: "gasPrice", type: "uint256" },
        { name: "gasToken", type: "address" },
        { name: "refundReceiver", type: "address" },
        { name: "signatures", type: "bytes" }
      ],
      name: "execTransaction",
      outputs: [{ name: "success", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "operation", type: "uint8" }
      ],
      name: "requiredTxGas",
      outputs: [{ name: "", type: "uint256" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [{ name: "hashToApprove", type: "bytes32" }],
      name: "approveHash",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [{ name: "_data", type: "bytes" }],
      name: "signMessage",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        { name: "_data", type: "bytes" },
        { name: "_signature", type: "bytes" }
      ],
      name: "isValidSignature",
      outputs: [{ name: "", type: "bytes4" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [{ name: "message", type: "bytes" }],
      name: "getMessageHash",
      outputs: [{ name: "", type: "bytes32" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "operation", type: "uint8" },
        { name: "safeTxGas", type: "uint256" },
        { name: "baseGas", type: "uint256" },
        { name: "gasPrice", type: "uint256" },
        { name: "gasToken", type: "address" },
        { name: "refundReceiver", type: "address" },
        { name: "_nonce", type: "uint256" }
      ],
      name: "encodeTransactionData",
      outputs: [{ name: "", type: "bytes" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "operation", type: "uint8" },
        { name: "safeTxGas", type: "uint256" },
        { name: "baseGas", type: "uint256" },
        { name: "gasPrice", type: "uint256" },
        { name: "gasToken", type: "address" },
        { name: "refundReceiver", type: "address" },
        { name: "_nonce", type: "uint256" }
      ],
      name: "getTransactionHash",
      outputs: [{ name: "", type: "bytes32" }],
      payable: false,
      stateMutability: "view",
      type: "function"
    }
  ]
};

// src/contracts/Safe/v1.0.0/SafeContract_v1_0_0.ts
var safeContract_v1_0_0_AbiTypes = (0, import_abitype10.narrow)(gnosis_safe_default.abi);

// src/contracts/Safe/v1.1.1/SafeContract_v1_1_1.ts
var import_abitype11 = require("abitype");

// src/contracts/assets/Safe/v1.1.1/gnosis_safe.ts
var gnosis_safe_default2 = {
  contractName: "GnosisSafe",
  version: "1.1.1",
  abi: [
    {
      inputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "AddedOwner",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "approvedHash",
          type: "bytes32"
        },
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "ApproveHash",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "masterCopy",
          type: "address"
        }
      ],
      name: "ChangedMasterCopy",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "threshold",
          type: "uint256"
        }
      ],
      name: "ChangedThreshold",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "contract Module",
          name: "module",
          type: "address"
        }
      ],
      name: "DisabledModule",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "contract Module",
          name: "module",
          type: "address"
        }
      ],
      name: "EnabledModule",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        }
      ],
      name: "ExecutionFailure",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "ExecutionFromModuleFailure",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "ExecutionFromModuleSuccess",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        }
      ],
      name: "ExecutionSuccess",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "RemovedOwner",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "msgHash",
          type: "bytes32"
        }
      ],
      name: "SignMsg",
      type: "event"
    },
    {
      payable: true,
      stateMutability: "payable",
      type: "fallback"
    },
    {
      constant: true,
      inputs: [],
      name: "NAME",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "VERSION",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "addOwnerWithThreshold",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      name: "approvedHashes",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "_masterCopy",
          type: "address"
        }
      ],
      name: "changeMasterCopy",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "changeThreshold",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "contract Module",
          name: "prevModule",
          type: "address"
        },
        {
          internalType: "contract Module",
          name: "module",
          type: "address"
        }
      ],
      name: "disableModule",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "domainSeparator",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "contract Module",
          name: "module",
          type: "address"
        }
      ],
      name: "enableModule",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "execTransactionFromModule",
      outputs: [
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "execTransactionFromModuleReturnData",
      outputs: [
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        },
        {
          internalType: "bytes",
          name: "returnData",
          type: "bytes"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "getModules",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "start",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "pageSize",
          type: "uint256"
        }
      ],
      name: "getModulesPaginated",
      outputs: [
        {
          internalType: "address[]",
          name: "array",
          type: "address[]"
        },
        {
          internalType: "address",
          name: "next",
          type: "address"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "getOwners",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "getThreshold",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "isOwner",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "nonce",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "prevOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "removeOwner",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "handler",
          type: "address"
        }
      ],
      name: "setFallbackHandler",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      name: "signedMessages",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "prevOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "oldOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "newOwner",
          type: "address"
        }
      ],
      name: "swapOwner",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address[]",
          name: "_owners",
          type: "address[]"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "address",
          name: "fallbackHandler",
          type: "address"
        },
        {
          internalType: "address",
          name: "paymentToken",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        },
        {
          internalType: "address payable",
          name: "paymentReceiver",
          type: "address"
        }
      ],
      name: "setup",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address payable",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "signatures",
          type: "bytes"
        }
      ],
      name: "execTransaction",
      outputs: [
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "requiredTxGas",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "bytes32",
          name: "hashToApprove",
          type: "bytes32"
        }
      ],
      name: "approveHash",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "bytes",
          name: "_data",
          type: "bytes"
        }
      ],
      name: "signMessage",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "bytes",
          name: "_data",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "_signature",
          type: "bytes"
        }
      ],
      name: "isValidSignature",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "bytes",
          name: "message",
          type: "bytes"
        }
      ],
      name: "getMessageHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_nonce",
          type: "uint256"
        }
      ],
      name: "encodeTransactionData",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_nonce",
          type: "uint256"
        }
      ],
      name: "getTransactionHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    }
  ]
};

// src/contracts/Safe/v1.1.1/SafeContract_v1_1_1.ts
var safeContract_v1_1_1_AbiTypes = (0, import_abitype11.narrow)(gnosis_safe_default2.abi);

// src/contracts/Safe/v1.2.0/SafeContract_v1_2_0.ts
var import_abitype12 = require("abitype");

// src/contracts/assets/Safe/v1.2.0/gnosis_safe.ts
var gnosis_safe_default3 = {
  contractName: "GnosisSafe",
  version: "1.2.0",
  abi: [
    {
      inputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "AddedOwner",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "approvedHash",
          type: "bytes32"
        },
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "ApproveHash",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "masterCopy",
          type: "address"
        }
      ],
      name: "ChangedMasterCopy",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "threshold",
          type: "uint256"
        }
      ],
      name: "ChangedThreshold",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "contract Module",
          name: "module",
          type: "address"
        }
      ],
      name: "DisabledModule",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "contract Module",
          name: "module",
          type: "address"
        }
      ],
      name: "EnabledModule",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        }
      ],
      name: "ExecutionFailure",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "ExecutionFromModuleFailure",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "ExecutionFromModuleSuccess",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        }
      ],
      name: "ExecutionSuccess",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "RemovedOwner",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "msgHash",
          type: "bytes32"
        }
      ],
      name: "SignMsg",
      type: "event"
    },
    {
      payable: true,
      stateMutability: "payable",
      type: "fallback"
    },
    {
      constant: true,
      inputs: [],
      name: "NAME",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "VERSION",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "addOwnerWithThreshold",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      name: "approvedHashes",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "_masterCopy",
          type: "address"
        }
      ],
      name: "changeMasterCopy",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "changeThreshold",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "contract Module",
          name: "prevModule",
          type: "address"
        },
        {
          internalType: "contract Module",
          name: "module",
          type: "address"
        }
      ],
      name: "disableModule",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "domainSeparator",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "contract Module",
          name: "module",
          type: "address"
        }
      ],
      name: "enableModule",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "execTransactionFromModule",
      outputs: [
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "execTransactionFromModuleReturnData",
      outputs: [
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        },
        {
          internalType: "bytes",
          name: "returnData",
          type: "bytes"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "getModules",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "start",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "pageSize",
          type: "uint256"
        }
      ],
      name: "getModulesPaginated",
      outputs: [
        {
          internalType: "address[]",
          name: "array",
          type: "address[]"
        },
        {
          internalType: "address",
          name: "next",
          type: "address"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "getOwners",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "getThreshold",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "contract Module",
          name: "module",
          type: "address"
        }
      ],
      name: "isModuleEnabled",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "isOwner",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "nonce",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "prevOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "removeOwner",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "handler",
          type: "address"
        }
      ],
      name: "setFallbackHandler",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      name: "signedMessages",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "prevOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "oldOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "newOwner",
          type: "address"
        }
      ],
      name: "swapOwner",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address[]",
          name: "_owners",
          type: "address[]"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "address",
          name: "fallbackHandler",
          type: "address"
        },
        {
          internalType: "address",
          name: "paymentToken",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        },
        {
          internalType: "address payable",
          name: "paymentReceiver",
          type: "address"
        }
      ],
      name: "setup",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address payable",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "signatures",
          type: "bytes"
        }
      ],
      name: "execTransaction",
      outputs: [
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        }
      ],
      payable: true,
      stateMutability: "payable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "requiredTxGas",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "bytes32",
          name: "hashToApprove",
          type: "bytes32"
        }
      ],
      name: "approveHash",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "bytes",
          name: "_data",
          type: "bytes"
        }
      ],
      name: "signMessage",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "bytes",
          name: "_data",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "_signature",
          type: "bytes"
        }
      ],
      name: "isValidSignature",
      outputs: [
        {
          internalType: "bytes4",
          name: "",
          type: "bytes4"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "bytes",
          name: "message",
          type: "bytes"
        }
      ],
      name: "getMessageHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_nonce",
          type: "uint256"
        }
      ],
      name: "encodeTransactionData",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    },
    {
      constant: true,
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_nonce",
          type: "uint256"
        }
      ],
      name: "getTransactionHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      payable: false,
      stateMutability: "view",
      type: "function"
    }
  ]
};

// src/contracts/Safe/v1.2.0/SafeContract_v1_2_0.ts
var safeContract_v1_2_0_AbiTypes = (0, import_abitype12.narrow)(gnosis_safe_default3.abi);

// src/contracts/Safe/v1.3.0/SafeContract_v1_3_0.ts
var import_abitype13 = require("abitype");

// src/contracts/assets/Safe/v1.3.0/gnosis_safe_l2.ts
var gnosis_safe_l2_default = {
  contractName: "GnosisSafeL2",
  version: "1.3.0",
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "AddedOwner",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "approvedHash",
          type: "bytes32"
        },
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "ApproveHash",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "handler",
          type: "address"
        }
      ],
      name: "ChangedFallbackHandler",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "guard",
          type: "address"
        }
      ],
      name: "ChangedGuard",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "threshold",
          type: "uint256"
        }
      ],
      name: "ChangedThreshold",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "DisabledModule",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "EnabledModule",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        }
      ],
      name: "ExecutionFailure",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "ExecutionFromModuleFailure",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "ExecutionFromModuleSuccess",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        }
      ],
      name: "ExecutionSuccess",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "RemovedOwner",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "module",
          type: "address"
        },
        {
          indexed: false,
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          indexed: false,
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "SafeModuleTransaction",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          indexed: false,
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          indexed: false,
          internalType: "address payable",
          name: "refundReceiver",
          type: "address"
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "signatures",
          type: "bytes"
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "additionalInfo",
          type: "bytes"
        }
      ],
      name: "SafeMultiSigTransaction",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256"
        }
      ],
      name: "SafeReceived",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "initiator",
          type: "address"
        },
        {
          indexed: false,
          internalType: "address[]",
          name: "owners",
          type: "address[]"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "threshold",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "address",
          name: "initializer",
          type: "address"
        },
        {
          indexed: false,
          internalType: "address",
          name: "fallbackHandler",
          type: "address"
        }
      ],
      name: "SafeSetup",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "msgHash",
          type: "bytes32"
        }
      ],
      name: "SignMsg",
      type: "event"
    },
    {
      stateMutability: "nonpayable",
      type: "fallback"
    },
    {
      inputs: [],
      name: "VERSION",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "addOwnerWithThreshold",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "hashToApprove",
          type: "bytes32"
        }
      ],
      name: "approveHash",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      name: "approvedHashes",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "changeThreshold",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "dataHash",
          type: "bytes32"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "signatures",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "requiredSignatures",
          type: "uint256"
        }
      ],
      name: "checkNSignatures",
      outputs: [],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "dataHash",
          type: "bytes32"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "signatures",
          type: "bytes"
        }
      ],
      name: "checkSignatures",
      outputs: [],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "prevModule",
          type: "address"
        },
        {
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "disableModule",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [],
      name: "domainSeparator",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "enableModule",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_nonce",
          type: "uint256"
        }
      ],
      name: "encodeTransactionData",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address payable",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "signatures",
          type: "bytes"
        }
      ],
      name: "execTransaction",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      stateMutability: "payable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "execTransactionFromModule",
      outputs: [
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "execTransactionFromModuleReturnData",
      outputs: [
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        },
        {
          internalType: "bytes",
          name: "returnData",
          type: "bytes"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [],
      name: "getChainId",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "start",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "pageSize",
          type: "uint256"
        }
      ],
      name: "getModulesPaginated",
      outputs: [
        {
          internalType: "address[]",
          name: "array",
          type: "address[]"
        },
        {
          internalType: "address",
          name: "next",
          type: "address"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "getOwners",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "offset",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "length",
          type: "uint256"
        }
      ],
      name: "getStorageAt",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "getThreshold",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_nonce",
          type: "uint256"
        }
      ],
      name: "getTransactionHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "isModuleEnabled",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "isOwner",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "nonce",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "prevOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "removeOwner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "requiredTxGas",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "handler",
          type: "address"
        }
      ],
      name: "setFallbackHandler",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "guard",
          type: "address"
        }
      ],
      name: "setGuard",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address[]",
          name: "_owners",
          type: "address[]"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "address",
          name: "fallbackHandler",
          type: "address"
        },
        {
          internalType: "address",
          name: "paymentToken",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        },
        {
          internalType: "address payable",
          name: "paymentReceiver",
          type: "address"
        }
      ],
      name: "setup",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      name: "signedMessages",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "targetContract",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "calldataPayload",
          type: "bytes"
        }
      ],
      name: "simulateAndRevert",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "prevOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "oldOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "newOwner",
          type: "address"
        }
      ],
      name: "swapOwner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      stateMutability: "payable",
      type: "receive"
    }
  ]
};

// src/contracts/Safe/v1.3.0/SafeContract_v1_3_0.ts
var safeContract_v1_3_0_AbiTypes = (0, import_abitype13.narrow)(gnosis_safe_l2_default.abi);

// src/contracts/Safe/v1.4.1/SafeContract_v1_4_1.ts
var import_abitype14 = require("abitype");

// src/contracts/assets/Safe/v1.4.1/safe_l2.ts
var safe_l2_default = {
  contractName: "SafeL2",
  version: "1.4.1",
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "AddedOwner",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "approvedHash",
          type: "bytes32"
        },
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "ApproveHash",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "handler",
          type: "address"
        }
      ],
      name: "ChangedFallbackHandler",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "guard",
          type: "address"
        }
      ],
      name: "ChangedGuard",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "threshold",
          type: "uint256"
        }
      ],
      name: "ChangedThreshold",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "DisabledModule",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "EnabledModule",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        }
      ],
      name: "ExecutionFailure",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "ExecutionFromModuleFailure",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "ExecutionFromModuleSuccess",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "txHash",
          type: "bytes32"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        }
      ],
      name: "ExecutionSuccess",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "RemovedOwner",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "module",
          type: "address"
        },
        {
          indexed: false,
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          indexed: false,
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "SafeModuleTransaction",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          indexed: false,
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          indexed: false,
          internalType: "address payable",
          name: "refundReceiver",
          type: "address"
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "signatures",
          type: "bytes"
        },
        {
          indexed: false,
          internalType: "bytes",
          name: "additionalInfo",
          type: "bytes"
        }
      ],
      name: "SafeMultiSigTransaction",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "sender",
          type: "address"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256"
        }
      ],
      name: "SafeReceived",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "initiator",
          type: "address"
        },
        {
          indexed: false,
          internalType: "address[]",
          name: "owners",
          type: "address[]"
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "threshold",
          type: "uint256"
        },
        {
          indexed: false,
          internalType: "address",
          name: "initializer",
          type: "address"
        },
        {
          indexed: false,
          internalType: "address",
          name: "fallbackHandler",
          type: "address"
        }
      ],
      name: "SafeSetup",
      type: "event"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "msgHash",
          type: "bytes32"
        }
      ],
      name: "SignMsg",
      type: "event"
    },
    {
      stateMutability: "nonpayable",
      type: "fallback"
    },
    {
      inputs: [],
      name: "VERSION",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "addOwnerWithThreshold",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "hashToApprove",
          type: "bytes32"
        }
      ],
      name: "approveHash",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address"
        },
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      name: "approvedHashes",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "changeThreshold",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "dataHash",
          type: "bytes32"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "signatures",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "requiredSignatures",
          type: "uint256"
        }
      ],
      name: "checkNSignatures",
      outputs: [],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "dataHash",
          type: "bytes32"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "signatures",
          type: "bytes"
        }
      ],
      name: "checkSignatures",
      outputs: [],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "prevModule",
          type: "address"
        },
        {
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "disableModule",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [],
      name: "domainSeparator",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "enableModule",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_nonce",
          type: "uint256"
        }
      ],
      name: "encodeTransactionData",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address payable",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "signatures",
          type: "bytes"
        }
      ],
      name: "execTransaction",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      stateMutability: "payable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "execTransactionFromModule",
      outputs: [
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "execTransactionFromModuleReturnData",
      outputs: [
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        },
        {
          internalType: "bytes",
          name: "returnData",
          type: "bytes"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [],
      name: "getChainId",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "start",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "pageSize",
          type: "uint256"
        }
      ],
      name: "getModulesPaginated",
      outputs: [
        {
          internalType: "address[]",
          name: "array",
          type: "address[]"
        },
        {
          internalType: "address",
          name: "next",
          type: "address"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "getOwners",
      outputs: [
        {
          internalType: "address[]",
          name: "",
          type: "address[]"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "offset",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "length",
          type: "uint256"
        }
      ],
      name: "getStorageAt",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "getThreshold",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        },
        {
          internalType: "uint256",
          name: "safeTxGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "baseGas",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "gasPrice",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "gasToken",
          type: "address"
        },
        {
          internalType: "address",
          name: "refundReceiver",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_nonce",
          type: "uint256"
        }
      ],
      name: "getTransactionHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "module",
          type: "address"
        }
      ],
      name: "isModuleEnabled",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address"
        }
      ],
      name: "isOwner",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "nonce",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "prevOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "owner",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        }
      ],
      name: "removeOwner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "handler",
          type: "address"
        }
      ],
      name: "setFallbackHandler",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "guard",
          type: "address"
        }
      ],
      name: "setGuard",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address[]",
          name: "_owners",
          type: "address[]"
        },
        {
          internalType: "uint256",
          name: "_threshold",
          type: "uint256"
        },
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "address",
          name: "fallbackHandler",
          type: "address"
        },
        {
          internalType: "address",
          name: "paymentToken",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "payment",
          type: "uint256"
        },
        {
          internalType: "address payable",
          name: "paymentReceiver",
          type: "address"
        }
      ],
      name: "setup",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      name: "signedMessages",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "targetContract",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "calldataPayload",
          type: "bytes"
        }
      ],
      name: "simulateAndRevert",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "prevOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "oldOwner",
          type: "address"
        },
        {
          internalType: "address",
          name: "newOwner",
          type: "address"
        }
      ],
      name: "swapOwner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      stateMutability: "payable",
      type: "receive"
    }
  ]
};

// src/contracts/Safe/v1.4.1/SafeContract_v1_4_1.ts
var safeContract_v1_4_1_AbiTypes = (0, import_abitype14.narrow)(safe_l2_default.abi);

// src/contracts/SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0.ts
var import_abitype15 = require("abitype");

// src/contracts/assets/SafeProxyFactory/v1.0.0/proxy_factory.ts
var proxy_factory_default = {
  contractName: "ProxyFactory",
  version: "1.0.0",
  abi: [
    {
      constant: false,
      inputs: [
        {
          name: "_mastercopy",
          type: "address"
        },
        {
          name: "initializer",
          type: "bytes"
        },
        {
          name: "saltNonce",
          type: "uint256"
        }
      ],
      name: "createProxyWithNonce",
      outputs: [
        {
          name: "proxy",
          type: "address"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "proxyCreationCode",
      outputs: [
        {
          name: "",
          type: "bytes"
        }
      ],
      payable: false,
      stateMutability: "pure",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          name: "masterCopy",
          type: "address"
        },
        {
          name: "data",
          type: "bytes"
        }
      ],
      name: "createProxy",
      outputs: [
        {
          name: "proxy",
          type: "address"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "proxyRuntimeCode",
      outputs: [
        {
          name: "",
          type: "bytes"
        }
      ],
      payable: false,
      stateMutability: "pure",
      type: "function"
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          name: "proxy",
          type: "address"
        }
      ],
      name: "ProxyCreation",
      type: "event"
    }
  ]
};

// src/contracts/SafeProxyFactory/v1.0.0/SafeProxyFactoryContract_v1_0_0.ts
var safeProxyFactoryContract_v1_0_0_AbiTypes = (0, import_abitype15.narrow)(
  proxy_factory_default.abi
);

// src/contracts/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1.ts
var import_abitype16 = require("abitype");

// src/contracts/assets/SafeProxyFactory/v1.1.1/proxy_factory.ts
var proxy_factory_default2 = {
  contractName: "ProxyFactory",
  version: "1.1.1",
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "contract GnosisSafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      name: "ProxyCreation",
      type: "event"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "masterCopy",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        }
      ],
      name: "createProxy",
      outputs: [
        {
          internalType: "contract GnosisSafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "proxyRuntimeCode",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      payable: false,
      stateMutability: "pure",
      type: "function"
    },
    {
      constant: true,
      inputs: [],
      name: "proxyCreationCode",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      payable: false,
      stateMutability: "pure",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "_mastercopy",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "initializer",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "saltNonce",
          type: "uint256"
        }
      ],
      name: "createProxyWithNonce",
      outputs: [
        {
          internalType: "contract GnosisSafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "_mastercopy",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "initializer",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "saltNonce",
          type: "uint256"
        },
        {
          internalType: "contract IProxyCreationCallback",
          name: "callback",
          type: "address"
        }
      ],
      name: "createProxyWithCallback",
      outputs: [
        {
          internalType: "contract GnosisSafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      constant: false,
      inputs: [
        {
          internalType: "address",
          name: "_mastercopy",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "initializer",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "saltNonce",
          type: "uint256"
        }
      ],
      name: "calculateCreateProxyWithNonceAddress",
      outputs: [
        {
          internalType: "contract GnosisSafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    }
  ]
};

// src/contracts/SafeProxyFactory/v1.1.1/SafeProxyFactoryContract_v1_1_1.ts
var safeProxyFactoryContract_v1_1_1_AbiTypes = (0, import_abitype16.narrow)(
  proxy_factory_default2.abi
);

// src/contracts/SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0.ts
var import_abitype17 = require("abitype");

// src/contracts/assets/SafeProxyFactory/v1.3.0/proxy_factory.ts
var proxy_factory_default3 = {
  contractName: "GnosisSafeProxyFactory",
  version: "1.3.0",
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "contract GnosisSafeProxy",
          name: "proxy",
          type: "address"
        },
        {
          indexed: false,
          internalType: "address",
          name: "singleton",
          type: "address"
        }
      ],
      name: "ProxyCreation",
      type: "event"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_singleton",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "initializer",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "saltNonce",
          type: "uint256"
        }
      ],
      name: "calculateCreateProxyWithNonceAddress",
      outputs: [
        {
          internalType: "contract GnosisSafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "singleton",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        }
      ],
      name: "createProxy",
      outputs: [
        {
          internalType: "contract GnosisSafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_singleton",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "initializer",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "saltNonce",
          type: "uint256"
        },
        {
          internalType: "contract IProxyCreationCallback",
          name: "callback",
          type: "address"
        }
      ],
      name: "createProxyWithCallback",
      outputs: [
        {
          internalType: "contract GnosisSafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_singleton",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "initializer",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "saltNonce",
          type: "uint256"
        }
      ],
      name: "createProxyWithNonce",
      outputs: [
        {
          internalType: "contract GnosisSafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [],
      name: "proxyCreationCode",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      stateMutability: "pure",
      type: "function"
    },
    {
      inputs: [],
      name: "proxyRuntimeCode",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      stateMutability: "pure",
      type: "function"
    }
  ]
};

// src/contracts/SafeProxyFactory/v1.3.0/SafeProxyFactoryContract_v1_3_0.ts
var safeProxyFactoryContract_v1_3_0_AbiTypes = (0, import_abitype17.narrow)(
  proxy_factory_default3.abi
);

// src/contracts/SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1.ts
var import_abitype18 = require("abitype");

// src/contracts/assets/SafeProxyFactory/v1.4.1/safe_proxy_factory.ts
var safe_proxy_factory_default = {
  contractName: "SafeProxyFactory",
  version: "1.4.1",
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "contract SafeProxy",
          name: "proxy",
          type: "address"
        },
        {
          indexed: false,
          internalType: "address",
          name: "singleton",
          type: "address"
        }
      ],
      name: "ProxyCreation",
      type: "event"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_singleton",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "initializer",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "saltNonce",
          type: "uint256"
        }
      ],
      name: "createChainSpecificProxyWithNonce",
      outputs: [
        {
          internalType: "contract SafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_singleton",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "initializer",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "saltNonce",
          type: "uint256"
        },
        {
          internalType: "contract IProxyCreationCallback",
          name: "callback",
          type: "address"
        }
      ],
      name: "createProxyWithCallback",
      outputs: [
        {
          internalType: "contract SafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "_singleton",
          type: "address"
        },
        {
          internalType: "bytes",
          name: "initializer",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "saltNonce",
          type: "uint256"
        }
      ],
      name: "createProxyWithNonce",
      outputs: [
        {
          internalType: "contract SafeProxy",
          name: "proxy",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [],
      name: "getChainId",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "proxyCreationCode",
      outputs: [
        {
          internalType: "bytes",
          name: "",
          type: "bytes"
        }
      ],
      stateMutability: "pure",
      type: "function"
    }
  ]
};

// src/contracts/SafeProxyFactory/v1.4.1/SafeProxyFactoryContract_v1_4_1.ts
var safeProxyFactoryContract_v1_4_1_AbiTypes = (0, import_abitype18.narrow)(
  safe_proxy_factory_default.abi
);

// src/contracts/SignMessageLib/v1.3.0/SignMessageLibContract_v1_3_0.ts
var import_abitype19 = require("abitype");

// src/contracts/assets/SignMessageLib/v1.3.0/sign_message_lib.ts
var sign_message_lib_default = {
  contractName: "SignMessageLib",
  version: "1.3.0",
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "msgHash",
          type: "bytes32"
        }
      ],
      name: "SignMsg",
      type: "event"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "message",
          type: "bytes"
        }
      ],
      name: "getMessageHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "_data",
          type: "bytes"
        }
      ],
      name: "signMessage",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }
  ]
};

// src/contracts/SignMessageLib/v1.3.0/SignMessageLibContract_v1_3_0.ts
var signMessageLibContract_v1_3_0_AbiTypes = (0, import_abitype19.narrow)(sign_message_lib_default.abi);

// src/contracts/SignMessageLib/v1.4.1/SignMessageLibContract_v1_4_1.ts
var import_abitype20 = require("abitype");

// src/contracts/assets/SignMessageLib/v1.4.1/sign_message_lib.ts
var sign_message_lib_default2 = {
  contractName: "SignMessageLib",
  version: "1.4.1",
  abi: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "bytes32",
          name: "msgHash",
          type: "bytes32"
        }
      ],
      name: "SignMsg",
      type: "event"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "message",
          type: "bytes"
        }
      ],
      name: "getMessageHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "_data",
          type: "bytes"
        }
      ],
      name: "signMessage",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    }
  ]
};

// src/contracts/SignMessageLib/v1.4.1/SignMessageLibContract_v1_4_1.ts
var signMessageLibContract_v1_4_1_AbiTypes = (0, import_abitype20.narrow)(sign_message_lib_default2.abi);

// src/contracts/SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_v1_3_0.ts
var import_abitype21 = require("abitype");

// src/contracts/assets/SimulateTxAccessor/v1.3.0/simulate_tx_accessor.ts
var simulate_tx_accessor_default = {
  contractName: "SimulateTxAccessor",
  version: "1.3.0",
  abi: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "simulate",
      outputs: [
        {
          internalType: "uint256",
          name: "estimate",
          type: "uint256"
        },
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        },
        {
          internalType: "bytes",
          name: "returnData",
          type: "bytes"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    }
  ]
};

// src/contracts/SimulateTxAccessor/v1.3.0/SimulateTxAccessorContract_v1_3_0.ts
var simulateTxAccessorContract_v1_3_0_AbiTypes = (0, import_abitype21.narrow)(
  simulate_tx_accessor_default.abi
);

// src/contracts/SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_v1_4_1.ts
var import_abitype22 = require("abitype");

// src/contracts/assets/SimulateTxAccessor/v1.4.1/simulate_tx_accessor.ts
var simulate_tx_accessor_default2 = {
  contractName: "SimulateTxAccessor",
  version: "1.4.1",
  abi: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "enum Enum.Operation",
          name: "operation",
          type: "uint8"
        }
      ],
      name: "simulate",
      outputs: [
        {
          internalType: "uint256",
          name: "estimate",
          type: "uint256"
        },
        {
          internalType: "bool",
          name: "success",
          type: "bool"
        },
        {
          internalType: "bytes",
          name: "returnData",
          type: "bytes"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    }
  ]
};

// src/contracts/SimulateTxAccessor/v1.4.1/SimulateTxAccessorContract_v1_4_1.ts
var simulateTxAccessorContract_v1_4_1_AbiTypes = (0, import_abitype22.narrow)(
  simulate_tx_accessor_default2.abi
);

// src/contracts/SafeWebAuthnSignerFactory/v0.2.1/SafeWebAuthnSignerFactory_v0_2_1.ts
var import_abitype23 = require("abitype");

// src/contracts/assets/SafeWebAuthnSignerFactory/v0.2.1/safe_webauthn_signer_factory.ts
var safe_webauthn_signer_factory_default = {
  contractName: "SafeWebAuthnSignerFactory",
  abi: [
    {
      inputs: [
        {
          internalType: "uint256",
          name: "x",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "y",
          type: "uint256"
        },
        {
          internalType: "P256.Verifiers",
          name: "verifiers",
          type: "uint176"
        }
      ],
      name: "createSigner",
      outputs: [
        {
          internalType: "address",
          name: "signer",
          type: "address"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "x",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "y",
          type: "uint256"
        },
        {
          internalType: "P256.Verifiers",
          name: "verifiers",
          type: "uint176"
        }
      ],
      name: "getSigner",
      outputs: [
        {
          internalType: "address",
          name: "signer",
          type: "address"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "message",
          type: "bytes32"
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes"
        },
        {
          internalType: "uint256",
          name: "x",
          type: "uint256"
        },
        {
          internalType: "uint256",
          name: "y",
          type: "uint256"
        },
        {
          internalType: "P256.Verifiers",
          name: "verifiers",
          type: "uint176"
        }
      ],
      name: "isValidSignatureForSigner",
      outputs: [
        {
          internalType: "bytes4",
          name: "magicValue",
          type: "bytes4"
        }
      ],
      stateMutability: "view",
      type: "function"
    }
  ]
};

// src/contracts/SafeWebAuthnSignerFactory/v0.2.1/SafeWebAuthnSignerFactory_v0_2_1.ts
var safeWebAuthnSignerFactory_v0_2_1_AbiTypes = (0, import_abitype23.narrow)(
  safe_webauthn_signer_factory_default.abi
);

// src/contracts/SafeWebAuthnSharedSigner/v0.2.1/SafeWebAuthnSharedSigner_v0_2_1.ts
var import_abitype24 = require("abitype");

// src/contracts/assets/SafeWebAuthnSharedSigner/v0.2.1/safe_webauthn_shared_signer.ts
var safe_webauthn_shared_signer_default = {
  contractName: "SafeWebAuthnSharedSigner",
  abi: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor"
    },
    {
      inputs: [],
      name: "NotDelegateCalled",
      type: "error"
    },
    {
      inputs: [],
      name: "SIGNER_SLOT",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: "uint256",
              name: "x",
              type: "uint256"
            },
            {
              internalType: "uint256",
              name: "y",
              type: "uint256"
            },
            {
              internalType: "P256.Verifiers",
              name: "verifiers",
              type: "uint176"
            }
          ],
          internalType: "struct SafeWebAuthnSharedSigner.Signer",
          name: "signer",
          type: "tuple"
        }
      ],
      name: "configure",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address"
        }
      ],
      name: "getConfiguration",
      outputs: [
        {
          components: [
            {
              internalType: "uint256",
              name: "x",
              type: "uint256"
            },
            {
              internalType: "uint256",
              name: "y",
              type: "uint256"
            },
            {
              internalType: "P256.Verifiers",
              name: "verifiers",
              type: "uint176"
            }
          ],
          internalType: "struct SafeWebAuthnSharedSigner.Signer",
          name: "signer",
          type: "tuple"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes32",
          name: "message",
          type: "bytes32"
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes"
        }
      ],
      name: "isValidSignature",
      outputs: [
        {
          internalType: "bytes4",
          name: "magicValue",
          type: "bytes4"
        }
      ],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [
        {
          internalType: "bytes",
          name: "data",
          type: "bytes"
        },
        {
          internalType: "bytes",
          name: "signature",
          type: "bytes"
        }
      ],
      name: "isValidSignature",
      outputs: [
        {
          internalType: "bytes4",
          name: "magicValue",
          type: "bytes4"
        }
      ],
      stateMutability: "view",
      type: "function"
    }
  ]
};

// src/contracts/SafeWebAuthnSharedSigner/v0.2.1/SafeWebAuthnSharedSigner_v0_2_1.ts
var safeWebAuthnSharedSigner_v0_2_1_AbiTypes = (0, import_abitype24.narrow)(
  safe_webauthn_shared_signer_default.abi
);

// src/types.ts
var OperationType = /* @__PURE__ */ ((OperationType2) => {
  OperationType2[OperationType2["Call"] = 0] = "Call";
  OperationType2[OperationType2["DelegateCall"] = 1] = "DelegateCall";
  return OperationType2;
})(OperationType || {});
var SigningMethod = /* @__PURE__ */ ((SigningMethod2) => {
  SigningMethod2["ETH_SIGN"] = "eth_sign";
  SigningMethod2["ETH_SIGN_TYPED_DATA"] = "eth_signTypedData";
  SigningMethod2["ETH_SIGN_TYPED_DATA_V3"] = "eth_signTypedData_v3";
  SigningMethod2["ETH_SIGN_TYPED_DATA_V4"] = "eth_signTypedData_v4";
  SigningMethod2["SAFE_SIGNATURE"] = "safe_sign";
  return SigningMethod2;
})(SigningMethod || {});
var SignatureTypes = {
  CONTRACT_SIGNATURE: "CONTRACT_SIGNATURE",
  EOA: "EOA",
  APPROVED_HASH: "APPROVED_HASH",
  ETH_SIGN: "ETH_SIGN"
};

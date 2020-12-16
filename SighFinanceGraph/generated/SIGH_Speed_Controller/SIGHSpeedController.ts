// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class DistributionInitialized extends ethereum.Event {
  get params(): DistributionInitialized__Params {
    return new DistributionInitialized__Params(this);
  }
}

export class DistributionInitialized__Params {
  _event: DistributionInitialized;

  constructor(event: DistributionInitialized) {
    this._event = event;
  }

  get blockNumber(): BigInt {
    return this._event.parameters[0].value.toBigInt();
  }
}

export class DistributionSpeedChanged extends ethereum.Event {
  get params(): DistributionSpeedChanged__Params {
    return new DistributionSpeedChanged__Params(this);
  }
}

export class DistributionSpeedChanged__Params {
  _event: DistributionSpeedChanged;

  constructor(event: DistributionSpeedChanged) {
    this._event = event;
  }

  get protocolAddress(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get prevSpeed(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get newSpeed(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get blockNumber(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }
}

export class Dripped extends ethereum.Event {
  get params(): Dripped__Params {
    return new Dripped__Params(this);
  }
}

export class Dripped__Params {
  _event: Dripped;

  constructor(event: Dripped) {
    this._event = event;
  }

  get protocolAddress(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get deltaBlocks(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get distributionSpeed(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get AmountDripped(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }

  get totalAmountDripped(): BigInt {
    return this._event.parameters[4].value.toBigInt();
  }

  get blockNumber(): BigInt {
    return this._event.parameters[5].value.toBigInt();
  }
}

export class NewProtocolSupported extends ethereum.Event {
  get params(): NewProtocolSupported__Params {
    return new NewProtocolSupported__Params(this);
  }
}

export class NewProtocolSupported__Params {
  _event: NewProtocolSupported;

  constructor(event: NewProtocolSupported) {
    this._event = event;
  }

  get protocolAddress(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get sighSpeed(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get totalDrippedAmount(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }

  get blockNumber(): BigInt {
    return this._event.parameters[3].value.toBigInt();
  }
}

export class ProtocolRemoved extends ethereum.Event {
  get params(): ProtocolRemoved__Params {
    return new ProtocolRemoved__Params(this);
  }
}

export class ProtocolRemoved__Params {
  _event: ProtocolRemoved;

  constructor(event: ProtocolRemoved) {
    this._event = event;
  }

  get protocolAddress(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get totalDrippedToProtocol(): BigInt {
    return this._event.parameters[1].value.toBigInt();
  }

  get blockNumber(): BigInt {
    return this._event.parameters[2].value.toBigInt();
  }
}

export class SIGHSpeedController__getSupportedProtocolStateResult {
  value0: boolean;
  value1: BigInt;
  value2: BigInt;
  value3: BigInt;

  constructor(value0: boolean, value1: BigInt, value2: BigInt, value3: BigInt) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
    this.value3 = value3;
  }

  toMap(): TypedMap<string, ethereum.Value> {
    let map = new TypedMap<string, ethereum.Value>();
    map.set("value0", ethereum.Value.fromBoolean(this.value0));
    map.set("value1", ethereum.Value.fromUnsignedBigInt(this.value1));
    map.set("value2", ethereum.Value.fromUnsignedBigInt(this.value2));
    map.set("value3", ethereum.Value.fromUnsignedBigInt(this.value3));
    return map;
  }
}

export class SIGHSpeedController extends ethereum.SmartContract {
  static bind(address: Address): SIGHSpeedController {
    return new SIGHSpeedController("SIGHSpeedController", address);
  }

  _isDripAllowed(): boolean {
    let result = super.call("_isDripAllowed", "_isDripAllowed():(bool)", []);

    return result[0].toBoolean();
  }

  try__isDripAllowed(): ethereum.CallResult<boolean> {
    let result = super.tryCall("_isDripAllowed", "_isDripAllowed():(bool)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  beginDripping(): boolean {
    let result = super.call("beginDripping", "beginDripping():(bool)", []);

    return result[0].toBoolean();
  }

  try_beginDripping(): ethereum.CallResult<boolean> {
    let result = super.tryCall("beginDripping", "beginDripping():(bool)", []);
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  changeProtocolSIGHSpeed(targetAddress: Address, newSpeed_: BigInt): boolean {
    let result = super.call(
      "changeProtocolSIGHSpeed",
      "changeProtocolSIGHSpeed(address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(targetAddress),
        ethereum.Value.fromUnsignedBigInt(newSpeed_)
      ]
    );

    return result[0].toBoolean();
  }

  try_changeProtocolSIGHSpeed(
    targetAddress: Address,
    newSpeed_: BigInt
  ): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "changeProtocolSIGHSpeed",
      "changeProtocolSIGHSpeed(address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(targetAddress),
        ethereum.Value.fromUnsignedBigInt(newSpeed_)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  getGlobalAddressProvider(): Address {
    let result = super.call(
      "getGlobalAddressProvider",
      "getGlobalAddressProvider():(address)",
      []
    );

    return result[0].toAddress();
  }

  try_getGlobalAddressProvider(): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "getGlobalAddressProvider",
      "getGlobalAddressProvider():(address)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  getRecentAmountDistributedToProtocol(protocolAddress: Address): BigInt {
    let result = super.call(
      "getRecentAmountDistributedToProtocol",
      "getRecentAmountDistributedToProtocol(address):(uint256)",
      [ethereum.Value.fromAddress(protocolAddress)]
    );

    return result[0].toBigInt();
  }

  try_getRecentAmountDistributedToProtocol(
    protocolAddress: Address
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getRecentAmountDistributedToProtocol",
      "getRecentAmountDistributedToProtocol(address):(uint256)",
      [ethereum.Value.fromAddress(protocolAddress)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getSIGHBalance(): BigInt {
    let result = super.call("getSIGHBalance", "getSIGHBalance():(uint256)", []);

    return result[0].toBigInt();
  }

  try_getSIGHBalance(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getSIGHBalance",
      "getSIGHBalance():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getSIGHSpeedForProtocol(protocolAddress: Address): BigInt {
    let result = super.call(
      "getSIGHSpeedForProtocol",
      "getSIGHSpeedForProtocol(address):(uint256)",
      [ethereum.Value.fromAddress(protocolAddress)]
    );

    return result[0].toBigInt();
  }

  try_getSIGHSpeedForProtocol(
    protocolAddress: Address
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getSIGHSpeedForProtocol",
      "getSIGHSpeedForProtocol(address):(uint256)",
      [ethereum.Value.fromAddress(protocolAddress)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getSighAddress(): Address {
    let result = super.call("getSighAddress", "getSighAddress():(address)", []);

    return result[0].toAddress();
  }

  try_getSighAddress(): ethereum.CallResult<Address> {
    let result = super.tryCall(
      "getSighAddress",
      "getSighAddress():(address)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddress());
  }

  getSupportedProtocolState(
    protocolAddress: Address
  ): SIGHSpeedController__getSupportedProtocolStateResult {
    let result = super.call(
      "getSupportedProtocolState",
      "getSupportedProtocolState(address):(bool,uint256,uint256,uint256)",
      [ethereum.Value.fromAddress(protocolAddress)]
    );

    return new SIGHSpeedController__getSupportedProtocolStateResult(
      result[0].toBoolean(),
      result[1].toBigInt(),
      result[2].toBigInt(),
      result[3].toBigInt()
    );
  }

  try_getSupportedProtocolState(
    protocolAddress: Address
  ): ethereum.CallResult<SIGHSpeedController__getSupportedProtocolStateResult> {
    let result = super.tryCall(
      "getSupportedProtocolState",
      "getSupportedProtocolState(address):(bool,uint256,uint256,uint256)",
      [ethereum.Value.fromAddress(protocolAddress)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(
      new SIGHSpeedController__getSupportedProtocolStateResult(
        value[0].toBoolean(),
        value[1].toBigInt(),
        value[2].toBigInt(),
        value[3].toBigInt()
      )
    );
  }

  getSupportedProtocols(): Array<Address> {
    let result = super.call(
      "getSupportedProtocols",
      "getSupportedProtocols():(address[])",
      []
    );

    return result[0].toAddressArray();
  }

  try_getSupportedProtocols(): ethereum.CallResult<Array<Address>> {
    let result = super.tryCall(
      "getSupportedProtocols",
      "getSupportedProtocols():(address[])",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toAddressArray());
  }

  getTotalAmountDistributedToProtocol(protocolAddress: Address): BigInt {
    let result = super.call(
      "getTotalAmountDistributedToProtocol",
      "getTotalAmountDistributedToProtocol(address):(uint256)",
      [ethereum.Value.fromAddress(protocolAddress)]
    );

    return result[0].toBigInt();
  }

  try_getTotalAmountDistributedToProtocol(
    protocolAddress: Address
  ): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getTotalAmountDistributedToProtocol",
      "getTotalAmountDistributedToProtocol(address):(uint256)",
      [ethereum.Value.fromAddress(protocolAddress)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  getlastDripBlockNumber(): BigInt {
    let result = super.call(
      "getlastDripBlockNumber",
      "getlastDripBlockNumber():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_getlastDripBlockNumber(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "getlastDripBlockNumber",
      "getlastDripBlockNumber():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }

  isThisProtocolSupported(protocolAddress: Address): boolean {
    let result = super.call(
      "isThisProtocolSupported",
      "isThisProtocolSupported(address):(bool)",
      [ethereum.Value.fromAddress(protocolAddress)]
    );

    return result[0].toBoolean();
  }

  try_isThisProtocolSupported(
    protocolAddress: Address
  ): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "isThisProtocolSupported",
      "isThisProtocolSupported(address):(bool)",
      [ethereum.Value.fromAddress(protocolAddress)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  removeSupportedProtocol(protocolAddress_: Address): boolean {
    let result = super.call(
      "removeSupportedProtocol",
      "removeSupportedProtocol(address):(bool)",
      [ethereum.Value.fromAddress(protocolAddress_)]
    );

    return result[0].toBoolean();
  }

  try_removeSupportedProtocol(
    protocolAddress_: Address
  ): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "removeSupportedProtocol",
      "removeSupportedProtocol(address):(bool)",
      [ethereum.Value.fromAddress(protocolAddress_)]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  supportNewProtocol(newProtocolAddress: Address, sighSpeed: BigInt): boolean {
    let result = super.call(
      "supportNewProtocol",
      "supportNewProtocol(address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(newProtocolAddress),
        ethereum.Value.fromUnsignedBigInt(sighSpeed)
      ]
    );

    return result[0].toBoolean();
  }

  try_supportNewProtocol(
    newProtocolAddress: Address,
    sighSpeed: BigInt
  ): ethereum.CallResult<boolean> {
    let result = super.tryCall(
      "supportNewProtocol",
      "supportNewProtocol(address,uint256):(bool)",
      [
        ethereum.Value.fromAddress(newProtocolAddress),
        ethereum.Value.fromUnsignedBigInt(sighSpeed)
      ]
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBoolean());
  }

  totalProtocolsSupported(): BigInt {
    let result = super.call(
      "totalProtocolsSupported",
      "totalProtocolsSupported():(uint256)",
      []
    );

    return result[0].toBigInt();
  }

  try_totalProtocolsSupported(): ethereum.CallResult<BigInt> {
    let result = super.tryCall(
      "totalProtocolsSupported",
      "totalProtocolsSupported():(uint256)",
      []
    );
    if (result.reverted) {
      return new ethereum.CallResult();
    }
    let value = result.value;
    return ethereum.CallResult.fromValue(value[0].toBigInt());
  }
}

export class ConstructorCall extends ethereum.Call {
  get inputs(): ConstructorCall__Inputs {
    return new ConstructorCall__Inputs(this);
  }

  get outputs(): ConstructorCall__Outputs {
    return new ConstructorCall__Outputs(this);
  }
}

export class ConstructorCall__Inputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }

  get sighInstrument_(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get _addressesProvider(): Address {
    return this._call.inputValues[1].value.toAddress();
  }
}

export class ConstructorCall__Outputs {
  _call: ConstructorCall;

  constructor(call: ConstructorCall) {
    this._call = call;
  }
}

export class BeginDrippingCall extends ethereum.Call {
  get inputs(): BeginDrippingCall__Inputs {
    return new BeginDrippingCall__Inputs(this);
  }

  get outputs(): BeginDrippingCall__Outputs {
    return new BeginDrippingCall__Outputs(this);
  }
}

export class BeginDrippingCall__Inputs {
  _call: BeginDrippingCall;

  constructor(call: BeginDrippingCall) {
    this._call = call;
  }
}

export class BeginDrippingCall__Outputs {
  _call: BeginDrippingCall;

  constructor(call: BeginDrippingCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class ChangeProtocolSIGHSpeedCall extends ethereum.Call {
  get inputs(): ChangeProtocolSIGHSpeedCall__Inputs {
    return new ChangeProtocolSIGHSpeedCall__Inputs(this);
  }

  get outputs(): ChangeProtocolSIGHSpeedCall__Outputs {
    return new ChangeProtocolSIGHSpeedCall__Outputs(this);
  }
}

export class ChangeProtocolSIGHSpeedCall__Inputs {
  _call: ChangeProtocolSIGHSpeedCall;

  constructor(call: ChangeProtocolSIGHSpeedCall) {
    this._call = call;
  }

  get targetAddress(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get newSpeed_(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class ChangeProtocolSIGHSpeedCall__Outputs {
  _call: ChangeProtocolSIGHSpeedCall;

  constructor(call: ChangeProtocolSIGHSpeedCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class DripCall extends ethereum.Call {
  get inputs(): DripCall__Inputs {
    return new DripCall__Inputs(this);
  }

  get outputs(): DripCall__Outputs {
    return new DripCall__Outputs(this);
  }
}

export class DripCall__Inputs {
  _call: DripCall;

  constructor(call: DripCall) {
    this._call = call;
  }
}

export class DripCall__Outputs {
  _call: DripCall;

  constructor(call: DripCall) {
    this._call = call;
  }
}

export class RemoveSupportedProtocolCall extends ethereum.Call {
  get inputs(): RemoveSupportedProtocolCall__Inputs {
    return new RemoveSupportedProtocolCall__Inputs(this);
  }

  get outputs(): RemoveSupportedProtocolCall__Outputs {
    return new RemoveSupportedProtocolCall__Outputs(this);
  }
}

export class RemoveSupportedProtocolCall__Inputs {
  _call: RemoveSupportedProtocolCall;

  constructor(call: RemoveSupportedProtocolCall) {
    this._call = call;
  }

  get protocolAddress_(): Address {
    return this._call.inputValues[0].value.toAddress();
  }
}

export class RemoveSupportedProtocolCall__Outputs {
  _call: RemoveSupportedProtocolCall;

  constructor(call: RemoveSupportedProtocolCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

export class SupportNewProtocolCall extends ethereum.Call {
  get inputs(): SupportNewProtocolCall__Inputs {
    return new SupportNewProtocolCall__Inputs(this);
  }

  get outputs(): SupportNewProtocolCall__Outputs {
    return new SupportNewProtocolCall__Outputs(this);
  }
}

export class SupportNewProtocolCall__Inputs {
  _call: SupportNewProtocolCall;

  constructor(call: SupportNewProtocolCall) {
    this._call = call;
  }

  get newProtocolAddress(): Address {
    return this._call.inputValues[0].value.toAddress();
  }

  get sighSpeed(): BigInt {
    return this._call.inputValues[1].value.toBigInt();
  }
}

export class SupportNewProtocolCall__Outputs {
  _call: SupportNewProtocolCall;

  constructor(call: SupportNewProtocolCall) {
    this._call = call;
  }

  get value0(): boolean {
    return this._call.outputValues[0].value.toBoolean();
  }
}

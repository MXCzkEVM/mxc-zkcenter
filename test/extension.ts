//==========================================================================
// Extension of bigint
//==========================================================================
(BigInt.prototype as any).toJSON = function(): string {
  return this.toString();
};

(BigInt.prototype as any).toHexString = function(): string {
  let ret_hex = this.toString(16);
  if (!ret_hex.startsWith('0x')) {
    ret_hex = '0x' + ret_hex;
  }
  return ret_hex;
};
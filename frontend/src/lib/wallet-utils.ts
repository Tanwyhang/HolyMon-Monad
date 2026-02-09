export function formatAddress(address: string, length: number = 4): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

export function formatBalance(balance: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = balance / divisor;
  const fraction = (balance % divisor).toString().padStart(decimals, "0");

  if (fraction === "0".repeat(decimals)) {
    return whole.toString();
  }

  const fractionTrimmed = fraction.replace(/0+$/, "");
  return `${whole}.${fractionTrimmed}`;
}

export function shortenHash(hash: string, length: number = 6): string {
  if (!hash || hash.length < 12) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-4)}`;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

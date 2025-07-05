require('dotenv').config()

const USDC_CONTRACT_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

module.exports = {
  RPC_URL: process.env.RPC_URL,
  WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
  WALLET_RELAYER_PRIVATE_KEY: process.env.WALLET_RELAYER_PRIVATE_KEY,
  WHALE_ADDRESS: "0x55fe002aeff02f77364de339a1292923a15844b8",
  RECIPIENT_AADDRESS: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  USDC_CONTRACT_ADDRESS,
  USDC_CONTRACT_ABI: [
    "function name() view returns (string)",
    "function nonces(address) view returns (uint256)",
    "function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
    "function transferFrom(address src, address dst, uint256 wad) returns (bool)",
    "function transfer(address dst, uint256 wad) returns (bool)",
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
  ],
  // Domain data pour EIP-712
  DOMAINS: {
    USDC_MAINNET: {
      chainId: 1,
      name: "USD Coin",
      version: "2",
      verifyingContract: USDC_CONTRACT_ADDRESS,
    },
  },
  // Types EIP-2612
  TYPES: {
    EIP2612_PERMIT: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
  },
};

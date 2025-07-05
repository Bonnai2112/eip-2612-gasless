const { JsonRpcProvider, Wallet, Contract, parseUnits, formatUnits, Signature } = require("ethers");
const { logBalanceOf } = require("./logger");
const { DOMAINS, TYPES, RECIPIENT_AADDRESS, RPC_URL, WALLET_PRIVATE_KEY, WALLET_RELAYER_PRIVATE_KEY, USDC_CONTRACT_ADDRESS, USDC_CONTRACT_ABI } = require("./constants");

const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(WALLET_PRIVATE_KEY, provider);
const relayer = new Wallet(WALLET_RELAYER_PRIVATE_KEY, provider);
const usdcInstance = new Contract(USDC_CONTRACT_ADDRESS, USDC_CONTRACT_ABI, provider);

async function main() {

  // wallet allow relayer to spend usdc on his account
  const value = parseUnits("100", 6);
  const nonce = await usdcInstance.nonces(wallet.address);
  const deadline = Math.floor(Date.now() / 1000) + 120;

  // Signature off-chain
  const signature = await wallet.signTypedData(DOMAINS.USDC_MAINNET, TYPES.EIP2612_PERMIT, {
    owner: wallet.address,
    spender: relayer.address,
    value,
    nonce,
    deadline,
  });
  const { v, r, s } = Signature.from(signature);

  // Exeecution transfer by relayer
  const tokenWithRelayerConnected = usdcInstance.connect(relayer)
  const tx = await tokenWithRelayerConnected.permit(wallet.address, relayer, value, deadline, v, r, s)
  await tx.wait();
  await tokenWithRelayerConnected.transferFrom(wallet.address, RECIPIENT_AADDRESS, value)

  console.log("******* After eip-2612 gasless execution **********");
  console.log("wallet usdc balance => ", await logBalanceOf(wallet.address, usdcInstance));
  console.log("wallet eth balance => ", await logBalanceOf(wallet.address));
  console.log("relayer eth balance => ", await logBalanceOf(relayer.address, usdcInstance));
  console.log("relayer usdc balance => ", await logBalanceOf(relayer.address));
  console.log("recipient usdc balance => ",  await logBalanceOf(RECIPIENT_AADDRESS, usdcInstance));
}

main();

const { JsonRpcProvider, Wallet, Contract, parseUnits } = require("ethers");
const { logBalanceOf } = require("./logger");
const {
  RPC_URL,
  WALLET_PRIVATE_KEY,
  USDC_CONTRACT_ADDRESS,
  USDC_CONTRACT_ABI,
  WHALE_ADDRESS,
} = require("./constants");

const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(WALLET_PRIVATE_KEY, provider);
const tokenInstance = new Contract(USDC_CONTRACT_ADDRESS, USDC_CONTRACT_ABI, provider);

async function main() {

  // Before prepare scenario
  console.log("******* Before prepa *******");
  console.log("whale usdc balance => ", await logBalanceOf(WHALE_ADDRESS, tokenInstance));
  console.log("wallet usdc balance => ", await logBalanceOf(wallet.address, tokenInstance));
  console.log("wallet eth balance => ", await logBalanceOf(wallet.address));

  // Send token impersonating whale to user wallet
  await provider.send("anvil_impersonateAccount", [WHALE_ADDRESS]);
  const whaleSigner = await provider.getSigner(WHALE_ADDRESS);

  // After transfer usdc from whale to wallet
  console.log("******* After prepa *******");
  await tokenInstance.connect(whaleSigner).transfer(wallet, parseUnits("1000", 6));
  console.log("whale usdc balance => ", await logBalanceOf(WHALE_ADDRESS, tokenInstance));
  console.log("wallet usdc balance => ", await logBalanceOf(wallet.address, tokenInstance));
  console.log("wallet eth balance => ", await logBalanceOf(wallet.address));
}

main();

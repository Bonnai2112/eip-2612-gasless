const { JsonRpcProvider, Wallet, Contract, parseUnits, formatUnits, Signature } = require("ethers");

async function main() {
  // Initialisation
  const provider = new JsonRpcProvider("http://localhost:8545");
  const wallet = new Wallet("c65852ae8e0bcbd0ba17859c6b7a8eca6f0d1ace2613136f79d5cd52eb18caf1", provider);
  const walletRelayer = new Wallet("ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  const whale = "0x55fe002aeff02f77364de339a1292923a15844b8";
  const tokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const nostroAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  // Paramètres du token
  const tokenInstance = new Contract(
    tokenAddress,
    [
      "function name() view returns (string)",
      "function nonces(address) view returns (uint256)",
      "function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
      "function transferFrom(address src, address dst, uint256 wad) returns (bool)",
      "function transfer(address dst, uint256 wad) returns (bool)",
      "function balanceOf(address) view returns (uint256)",
    ],
    walletRelayer
  );

  // simulate transfer token
  // await provider.send("anvil_impersonateAccount", [whale])
  // const signer = await provider.getSigner(whale)
  // await tokenInstance.connect(signer).transfer(wallet, parseUnits("1000", 6))
  // console.log("balance of whale => ", formatUnits(await tokenInstance.balanceOf(wallet), 6))
  console.log("===> Balances before");
  console.log("wallet eth balance => ", formatUnits(await provider.getBalance(wallet), 18));
  console.log("relayer eth balance => ", formatUnits(await provider.getBalance(walletRelayer), 18));
  console.log("wallet usdc balance => ", formatUnits(await tokenInstance.balanceOf(wallet), 6));
  console.log("relayer usdc balance => ", formatUnits(await tokenInstance.balanceOf(walletRelayer), 6));

  // wallet allow relayer to spend usdc on his account
  const value = parseUnits("100", 6);
  const nonce = await tokenInstance.nonces(wallet.address);
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // Domain data pour EIP-712
  const domain = {
    name: "USD Coin",
    version: "2",
    chainId: 1,
    verifyingContract: tokenAddress,
  };

  // // Types EIP-2612
  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  // Signature off-chain
  const signature = await wallet.signTypedData(domain, types, {
    owner: wallet.address,
    spender: walletRelayer.address,
    value,
    nonce,
    deadline,
  });

  const { v, r, s } = Signature.from(signature);
  console.log("r, s, v => ", r, s, v);

  // Envoi on-chain : le relayer appelle permit
  await tokenInstance.permit(wallet.address, walletRelayer, value, deadline, v, r, s);
  await tokenInstance.transferFrom(wallet.address, nostroAddress, value);

  console.log("===> Balances After");
  console.log("wallet eth balance => ", formatUnits(await provider.getBalance(wallet), 18));
  console.log("relayer eth balance => ", formatUnits(await provider.getBalance(walletRelayer), 18));
  console.log("wallet usdc balance => ", formatUnits(await tokenInstance.balanceOf(wallet), 6));
  console.log("relayer usdc balance => ", formatUnits(await tokenInstance.balanceOf(walletRelayer), 6));
}

main();

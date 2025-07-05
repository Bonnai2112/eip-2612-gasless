const {JsonRpcProvider, formatUnits} = require('ethers')

const provider = new JsonRpcProvider('http://127.0.0.1:8545')

async function logBalanceOf(address, tokenInstance) {
    if (
      typeof tokenInstance === "object" &&
      tokenInstance !== null &&
      !Array.isArray(tokenInstance) &&
      Object.keys(tokenInstance).length > 0
    ) {
      return formatUnits(await tokenInstance.balanceOf(address), 6);
    } else {
      return formatUnits(await provider.getBalance(address), 18);
    }
  }

module.exports = {
    logBalanceOf
}
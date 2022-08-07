const markets = require('../config/markets').markets
module.exports.initializeTransactionData = function(
    contractData,
    recipient,
    contractAddress
)  {
    const tx = {
        swap: {},
        isSwap: markets[recipient].name === 'NFT Trader 🔄',
        isSweep: markets[recipient].name === 'Gem 💎' || markets[recipient].name === 'Genie 🧞‍♂️',
        tokens: [],
        prices: [],
        totalPrice: 0,
        symbol: contractData.symbol,
        tokenType: contractData.tokenType,
        contractName: contractData.name,
        marketList: [],
        market: markets[recipient],
        currency: { name: 'ETH', decimals: 18 },
        contractAddress: contractAddress
    };

    return tx;
};

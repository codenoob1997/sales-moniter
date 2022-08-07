const parseTransaction = require('./parseTransaction').parseTransaction
const setup = require('../config/setup')
const DISCORD_ENABLED = setup.DISCORD_ENABLED
const TWITTER_ENABLED = setup.TWITTER_ENABLED
const runApp = async(
    transactionHash,
    contractAddress,
    ContractData
) => {
    const txData = await parseTransaction(transactionHash, contractAddress, ContractData);

    if (txData) {
        const {
            tokenName,
            contractName,
            isSwap,
            swap,
            addressMaker,
            addressTaker,
            market,
            totalPrice,
            currency,
            quantity
        } = txData;

        if (isSwap && addressMaker && addressTaker) {
            console.log(
                '--------------------------------------------------------------------------------'
            );
            console.log(`${contractName} Swap on NFTTrader.io #${swap.id}`);
            console.log(`Maker: ${swap[addressMaker].name}`);
            console.log(`Spent Assets: ${JSON.stringify(swap[addressMaker].spentAssets)}`);
            console.log(`Spent Value: ${swap[addressMaker].spentAmount} ETH`);
            console.log(`Received Assets: ${JSON.stringify(swap[addressMaker].receivedAssets)}`);
            console.log(`Received Value: ${swap[addressMaker].receivedAmount} ETH`);
            console.log('🔄');
            console.log(`Taker: ${swap[addressTaker].name}`);
            console.log(`Spent Assets: ${JSON.stringify(swap[addressTaker].spentAssets)}`);
            console.log(`Spent Value: ${swap[addressTaker].spentAmount} ETH`);
            console.log(`Received Assets: ${JSON.stringify(swap[addressTaker].receivedAssets)}`);
            console.log(`Received Value: ${swap[addressTaker].receivedAmount} ETH`);
            console.log(`\nhttps://etherscan.io/txData/${transactionHash}`);
            console.log(
                '--------------------------------------------------------------------------------'
            );
        } else {
            console.log(
                `${quantity} ${contractName || tokenName} sold on ${
                    market.name
                } for ${totalPrice} ${currency.name}`
            );
            console.log(`https://etherscan.io/txData/${transactionHash}\n`);
        }
    }

    if (DISCORD_ENABLED && TWITTER_ENABLED && txData) {
        const tweetConfig = await sendEmbedMessage(txData);
        await tweet(tweetConfig);
    } else if (DISCORD_ENABLED && txData) {
        await sendEmbedMessage(txData);
    } else if (TWITTER_ENABLED && txData) {
        await tweet(txData);
    }
};

module.exports = {
    runApp
}
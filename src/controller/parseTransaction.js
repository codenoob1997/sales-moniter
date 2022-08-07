const api = require('../utils/api.js')
const _ = require('lodash')
const ethers = require('ethers')
const markets = require('../config/markets').markets
// const parseNftTrader = require('./parseNftTrader.js')
// const parseSaleToken = require('./parseSaleToken')
// const parseSwapToken = require('./parseSwapToken')
const currencies = require('../config/currencies')
const logEventType = require('../config/logEventType')
const parseSaleToken = require('./parseSaleToken').parseSaleToken
const getENSName = api.getENSName
const getContractData = api.getContractData
const getReadableName = api.getReadableName
const getEthUsdPrice = api.getEthUsdPrice
const getTokenData = api.getTokenData
const saleEventTypes = logEventType.saleEventTypes
const Web3EthAbi = require('web3-eth-abi')
const setup = require('../config/setup.js')
const parseSeaport = require('./parseSeaport').parseSeaport
const initializeTransactionData = require('../config/initialize.js').initializeTransactionData
const alchemy = setup.alchemy
txHash = '0x5ddbb31a73bee7bea24e5cf24a8096de03fcb65f29b51e7ed3a7c4497b385880'
contractAddress = '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e'

const isSeaport = decodedLogData => {
    return (decodedLogData).offer !== undefined;
};

const isNftTrader = decodedLogData => {
    return (decodedLogData)._swapId !== undefined;
};

async function test(contractAddress){
    const contractData = await getContractData(contractAddress)
    return contractData
}
module.exports.parseTransaction= async (
    transactionHash,
    contractAddress,
    contractData
) => {
    const receipt = await alchemy.core.getTransactionReceipt(transactionHash)
    const recipient = receipt?receipt.to.toLowerCase():'';
    // 判断
    if(!receipt || !(recipient in markets)){
        return null
    }

    let tx = initializeTransactionData(contractData,recipient,contractAddress)

    for (const log of receipt.logs){
        const logAddress = log.address.toLowerCase();
        const logMarket = _.get(markets, logAddress);
        if (logAddress in currencies && !tx.isSweep) {
            tx.currency = currencies[logAddress];
        }

        if (tx.isSwap) {
            parseSwapToken(tx, log, logAddress);
        } else {
            parseSaleToken(tx, log, logAddress);
        }
        // 该log是否是交易
        const isSale = logAddress === recipient && saleEventTypes.includes(log.topics[0]);
        const isAggregatorSale = logAddress in markets && saleEventTypes.includes(log.topics[0]);
        if (isSale || isAggregatorSale) {
            const marketLogDecoder = isSale
                ? tx.market.logDecoder
                : markets[logAddress].logDecoder;

            if (marketLogDecoder === undefined) return null;

            const decodedLogData = Web3EthAbi.decodeLog(marketLogDecoder, log.data, []);
            if (isSeaport(decodedLogData)) {
                const parseResult = parseSeaport(tx, logMarket, decodedLogData);
                if (parseResult === null) continue;
            } else if (isNftTrader(decodedLogData)) {
                const parseResult = await parseNftTrader(tx, log, logAddress, decodedLogData);

                if (parseResult === null) return null;
            } else if (tx.marketList.length + 1 === tx.tokens.length) {
                const decodedPrice =
                    logMarket.name === 'X2Y2 ⭕️' ? decodedLogData.amount : decodedLogData.price;
                const price = Number(ethers.utils.formatUnits(decodedPrice, tx.currency.decimals));

                tx.totalPrice += price;
                tx.marketList.push(logMarket);
                tx.prices.push(formatPrice(price));
            }
        }
    }
    // console.log(tx)
    tx.quantity = tx.tokenType === 'ERC721' ? tx.tokens.length : _.sum(tx.tokens);
    if ((!tx.isSwap && tx.quantity === 0) || (tx.isSwap && !tx.swap.monitorTokenId)) {
        console.error('No tokens found. Please check the contract address is correct.');
        return null;
    }
    tx.to = !tx.isSwap ? await getReadableName(tx.toAddr ?? '') : '';
    tx.from = !tx.isSwap ? await getReadableName(tx.fromAddr ?? '') : '';
    tx.tokenData = tx.swap.monitorTokenId
        ? await getTokenData(contractAddress, tx.swap.monitorTokenId, tx.tokenType)
        : await getTokenData(contractAddress, tx.tokenId ?? '', tx.tokenType);
    tx.tokenName = tx.tokenData.name || `${tx.symbol} #${tx.tokenId}`;
    tx.sweeperAddr = receipt.from;
    tx.sweeper = tx.isSweep ? await getReadableName(tx.sweeperAddr) : '';
    tx.usdPrice =
        !tx.isSwap && (tx.currency.name === 'ETH' || tx.currency.name === 'WETH')
            ? await getEthUsdPrice(tx.totalPrice)
            : null;
    tx.ethUsdValue = tx.usdPrice ? `($ ${tx.usdPrice})` : '';
    tx.transactionHash = transactionHash;
    return tx;

}


async function main_test(){
    const contractData = await test(contractAddress)
    const result = await parseTransaction(txHash,contractAddress,contractData)
}


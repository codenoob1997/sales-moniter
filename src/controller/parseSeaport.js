const ethers = require('ethers')
const currencies = require('../config/currencies').currencies
const api = require('../utils/api')
const formatPrice = api.formatPrice

module.exports.parseSeaport = (tx, logMarket, decodedLogData) => {
    const offer = decodedLogData.offer;
    const consideration = decodedLogData.consideration;
    const nftOnOfferSide = offer.some((item) => item.token.toLowerCase() === tx.contractAddress.toLowerCase());
    const nftOnConsiderationSide = consideration.some(
        (item) => item.token.toLowerCase() === tx.contractAddress.toLowerCase()
    );
    let price;

    // Skip if the target token is not on both sides (offer & consideration)
    if (!nftOnOfferSide && !nftOnConsiderationSide) return null;

    // if target nft on offer side, then consideration is the total price
    // else offer is the total price
    if (nftOnOfferSide) {
        const totalConsiderationAmount = consideration.reduce(reducer, 0);
        price = totalConsiderationAmount;
    } else {
        const totalOfferAmount = offer.reduce(reducer, 0);
        price = totalOfferAmount;
    }
    tx.totalPrice += price;
    tx.marketList.push(logMarket);
    tx.prices.push(formatPrice(price));

    return [price, false];
};

function reducer(previous, current) {
    const currency = currencies[current.token.toLowerCase()];
    if (currency !== undefined) {
        const result =
            previous + Number(ethers.utils.formatUnits(current.amount, currency.decimals));

        return result;
    } else {
        return previous;
    }
}

// import axios from 'axios'
// import ethers from 'ethers'
// import {
//     alchemy,
//     TOKEN_TYPE,
//     CONTRACT_ADDRESS,
//     CONTRACT_ADDRESSES,
//     DEFAULT_NFT_API
// } from './config/setup.js'
// import { NftTokenType } from 'alchemy-sdk'
const axios = require('axios')

const ethers = require('ethers')
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const setup = require('../config/setup.js')
const alchemy_sdk = require('alchemy-sdk')
const retry = require('async-retry')
const _ = require('lodash');
const alchemy = setup.alchemy
const TOKEN_TYPE = setup.TOKEN_TYPE
const CONTRACT_ADDRESS = setup.CONTRACT_ADDRESS
const CONTRACT_ADDRESSES = setup.CONTRACT_ADDRESSES
const DEFAULT_NFT_API = setup.DEFAULT_NFT_API
const NftTokenType = alchemy_sdk.NftTokenType
const ETHERSCAN_API_KEY = setup.ETHERSCAN_API_KEY
const escanApi = require('etherscan-api').init(ETHERSCAN_API_KEY)
const ALCHEMY_API_KEY = setup.ALCHEMY_API_KEY
const onGetContractMetaData = async (contractAddress) => {
    const result = await getContractMetaDataAlchemy(contractAddress)
    console.log(result)
}

const getContractMetaDataAlchemy = async function (contractAddress) {
    const response = await alchemy.nft.getContractMetadata(contractAddress)
    if (response === null) {
        throw new Error('Might hitting rate limit, try again')
    }
    return {
        name:_.get(response,'name'),
        symbol:_.get(response,'symbol'),
        tokenType:_.get(response,'tokenType')
    } 
}
// { name: 'Doodles', symbol: 'DOODLE', tokenType: 'ERC721' }
const retryOnGetContractMetaData = async function (contractAddress) {
    const result = await retry(
        async () =>{
            const response = await alchemy.nft.getContractMetadata(contractAddress);

            if (response === null) {
                throw new Error('Might hitting rate limit, try again');
            }

            return {
                name: _.get(response, 'name'),
                symbol: _.get(response, 'symbol'),
                tokenType: _.get(response, 'tokenType')
            };
        }
        ,{
        retries:5
    })
    return result
}
const retryOnGetNFTMetaData = async (contractAddress,tokenId,tokenType) => {
    const result = await retry(
        async ()=>{
            const response = await alchemy.nft.getNftMetadata(contractAddress,tokenId)
            if(response === null) {
                throw new Error('Might hitting rate limit, try again ')
            }
            return {
                name: _.get(response,'title'),
                image: _.get(response,'media[0].gateway')
            }
        },
        {
            retries:5
        }
    )
    return result
}

const getTokenData = async (contractAddress,tokenId,tokenType) => {
    let tokenData;
    // I dont have opensea API key 
    // @opensea
    // im going to use Alchemy API always
    tokenData = await retryOnGetNFTMetaData(contractAddress, tokenId, tokenType)
    return tokenData
}


const getContractData = async (contractAddress) => {
    let contractData;
    contractData = await retryOnGetContractMetaData(contractAddress);
    return contractData;
};

/* {
  name: 'Doodle #3632',
  image: 'https://res.cloudinary.com/alchemyapi/image/upload/mainnet/b146d8e59ceb5e61db4e290053232780.png'
}
*/
const getTokenDataType = async (contractAddress) => {
    const response = await getContractData(contractAddress)
    const {
        name,
        symbol,
        tokenType
    } = response
    tokenData = await retryOnGetNFTMetaData(contractAddress, '3632')
    return tokenData
}
const getEthUsdPrice = async (ethPrice) => {
    const url = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${ETHERSCAN_API_KEY}`;
    const backupurl = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR'
    const result = await retry(
        async () => {
            const response = await axios.get(backupurl);
            console.log(response)
            let ethusd;
            if('result' in response.data){
                result = _.get(response, ['data', 'result']);
                ethusd = _.get(response.data.result, 'ethusd');
            }else{
                ethusd = _.get(response.data,'USD')
            }
            const usdPrice = (ethPrice * ethusd).toFixed(2);

            if (!response || !ethusd || !usdPrice) {
                throw new Error('Might hitting rate limit, try again');
            }
            return parseFloat(usdPrice).toLocaleString('en-US');
        },
        {
            retries: 5
        }
    );

    return result;
};


const formatPrice = (price) => {
    let formatedPrice = price.toLocaleString('en-US', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    });
    const lastChar = formatedPrice.length - 1;

    formatedPrice = formatedPrice[lastChar] === '0' ? formatedPrice.slice(0, -1) : formatedPrice;
    return formatedPrice;
};

// thomaslok.th
const getENSName = async (address) => {
    try {
        // const provider = new ethers.providers.CloudflareProvider();
        const provider = new ethers.providers.AlchemyProvider('homestead', ALCHEMY_API_KEY);
        const result = await provider.lookupAddress(address);

        return result;
    } catch (error) {
        console.log('API error: ', error);
    }
};
// getENSName('0xE9D412869c361c99797083505A298fcC0c6fE4cb').then(res=>console.log(res))
const getReadableName = async (address) => {
    const result =
        (await getENSName(address)) || shortenAddress(address);

    return result;
};
const shortenAddress = (address) => {
    if (!ethers.utils.isAddress(address)) {
        throw new Error('Not a valid address');
    }
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
};
module.exports = {
    formatPrice,
    getEthUsdPrice,
    getContractData,
    getENSName,
    getReadableName,
    getTokenData
}
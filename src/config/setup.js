// import { Network,Alchemy } from "alchemy-sdk";
require('dotenv').config()
const alchemy_sdk = require('alchemy-sdk')
const Network = alchemy_sdk.Network
const Alchemy = alchemy_sdk.Alchemy
const DISCORD_ENABLED = 0
const TWITTER_ENABLED = 0
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS?process.env.CONTRACT_ADDRESS.toLowerCase():'';
const CONTRACT_ADDRESSES = process.env.CONTRACT_ADDRESSES?process.env.CONTRACT_ADDRESSES.toLowerCase():'';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || ''
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const DEFAULT_NFT_API = 'Alchemy';
// Optional settings
const TOKEN_TYPE = process.env.TOKEN_TYPE || '';

// Alchemy skd setup
const settings = {
    apiKey: ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET
}
const alchemy = new Alchemy(settings);

module.exports =  {
    alchemy,
    CONTRACT_ADDRESS,
    CONTRACT_ADDRESSES,
    ALCHEMY_API_KEY,
    ETHERSCAN_API_KEY,
    TOKEN_TYPE,
    DISCORD_ENABLED,
    TWITTER_ENABLED
}
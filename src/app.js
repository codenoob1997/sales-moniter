const setup = require("./config/setup.js")
const api = require("./utils/api")
const getContractData = api.getContractData
const transferEventTypes = require('./config/logEventType.js')
const { last } = require("lodash")
const alchemy = setup.alchemy
const TOKEN_TYPE = setup.tokenType
const CONTRACT_ADDRESS = setup.CONTRACT_ADDRESS
const CONTRACT_ADDRESSES = setup.CONTRACT_ADDRESSES
const DEFAULT_NFT_API = setup.DEFAULT_NFT_API
const runApp = require('./controller/runApp').runApp
let lastTransactionHash
async function main(contractAddress){
    const contractData = await getContractData(contractAddress)
    const tokenType = contractData.tokenType === 'UNKNOWN'?TOKEN_TYPE:contractData.tokenType;

    if(tokenType !== 'ERC721' && tokenType !== 'ERC1155'){
        console.log(contractData)
        console.log('Not supported token type')
        console.log('Please enter the TOKEN_TYPE in (file:./.enc)')
        process.exit(1)
    }
    const eventFilter = {
        address:contractAddress,
        topics:[transferEventTypes[tokenType]]
    }
    // 0xcdbf12722615269158d8959abe47cc83caddb112
    console.log(`Listening to ${tokenType} transfer events on collection: ${contractData.name}`);
    console.log(`Contract address: ${contractAddress}\n`);
    alchemy.ws.on(eventFilter,async(log)=>{
        const txHash = log.transactionHash.toLowerCase();
        if(txHash === lastTransactionHash) return
        lastTransactionHash = txHash;
        await runApp(txHash,contractAddress,contractData)
    })
    
}


(async () => {

    try {
        await main(CONTRACT_ADDRESS);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }

})()
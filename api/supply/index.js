'use strict';

const {web3Factory} = require("../../utils/web3");
const LuxorContractABI = require('../../abis/LuxorContractABI.json');
const {_1E18, FTM_CHAIN_ID} = require("../../constants");
const LUXOR_ADDRESS = "0x6671E20b83Ba463F270c8c75dAe57e3Cc246cB2b";
const BN = require('bn.js');

const web3 = web3Factory(FTM_CHAIN_ID);
const luxorContract = new web3.eth.Contract(LuxorContractABI, LUXOR_ADDRESS);

class Cache {
    minElapsedTimeInMs = 10000; // 10 seconds

    constructor() {
        this.cachedCirculatingSupply = undefined
        this.cachedMaxSupply = undefined
        this.cachedTotalSupply = undefined
    }

    async getTotalSupply() {
        if (!this.cachedTotalSupply ||
            this.cachedTotalSupply.lastRequestTimestamp + this.minElapsedTimeInMs < Date.now() // check if supply needs to be updated
        ) {
            const totalSupply = new BN(await luxorContract.methods.totalSupply().call());
            const lastRequestTimestamp = Date.now();
            this.cachedTotalSupply = {totalSupply, lastRequestTimestamp}
        }

        return this.cachedTotalSupply.totalSupply
    }

    async getMaxSupply() {
        if (!this.cachedMaxSupply) {
            const maxSupply = 25_000_000 * 10**18; // new BN(await luxorContract.methods.maxSupply().call());
            const lastRequestTimestamp = Date.now();
            this.cachedMaxSupply = {maxSupply, lastRequestTimestamp}
        }
        return this.cachedMaxSupply.maxSupply
    }

        async getCirculatingSupply() {
        if (!this.cachedCirculatingSupply ||
            this.cachedCirculatingSupply.lastRequestTimestamp + this.minElapsedTimeInMs < Date.now() // check if supply needs to be updated
        ) {
            const results = await Promise.all([
                this.getTotalSupply(),                                         // Total Supply [0]
                getBalanceOf("0xcB5ba2079C7E9eA6571bb971E383Fe5D59291a95"),    // DAO Reserves [1]
            ])

            // TOTAL SUPPLY - DAO RESERVES
            const circulatingSupply = new BN(results[0]).sub(new BN(results[1]))
            
            const lastRequestTimestamp = Date.now();
            this.cachedCirculatingSupply = {circulatingSupply, lastRequestTimestamp}
        }
        return this.cachedCirculatingSupply.circulatingSupply
    }
}

async function getBalanceOf(address) {
    return await luxorContract.methods.balanceOf(address).call();
}

async function circulatingSupply(ctx) {
    ctx.body = (await cache.getCirculatingSupply()).toString();
}

async function circulatingSupplyAdjusted(ctx) {
    ctx.body = ((await cache.getCirculatingSupply()).div(1E9)).toString();
}

async function totalSupply(ctx) {
    ctx.body = (await cache.getTotalSupply()).toString();
}

async function totalSupplyAdjusted(ctx) {
    ctx.body = ((await cache.getTotalSupply()).div(1E9)).toString();
}

async function maxSupply(ctx) {
    ctx.body = (await cache.getMaxSupply()).toString();
}

const cache = new Cache()
module.exports = { circulatingSupply, circulatingSupplyAdjusted, totalSupply, totalSupplyAdjusted, maxSupply };
